-- Atualizar função validar_retirada_amostra para aceitar quantidade_retirada
CREATE OR REPLACE FUNCTION public.validar_retirada_amostra(
  p_codigo_versao character varying, 
  p_usuario character varying, 
  p_status_textual character varying, 
  p_metodo character varying, 
  p_observacoes text DEFAULT NULL::text, 
  p_ip_address inet DEFAULT NULL::inet, 
  p_user_agent text DEFAULT NULL::text,
  p_quantidade_retirada numeric DEFAULT NULL::numeric
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cronograma_id UUID;
  v_amostra_id UUID;
  v_amostra_status VARCHAR;
  v_retirada_id UUID;
  v_codigo_base VARCHAR;
  v_validacao_sequencial jsonb;
BEGIN
  -- Buscar o cronograma pelo código de versão
  SELECT 
    cr.id,
    cr.amostra_id,
    a.status,
    a.codigo
  INTO 
    v_cronograma_id,
    v_amostra_id,
    v_amostra_status,
    v_codigo_base
  FROM cronograma_retiradas cr
  JOIN amostras a ON a.id = cr.amostra_id
  WHERE cr.codigo_versao = p_codigo_versao;
  
  -- Verificar se o código de versão existe
  IF v_cronograma_id IS NULL THEN
    RETURN jsonb_build_object(
      'sucesso', false,
      'erro', 'Código de versão não encontrado: ' || p_codigo_versao,
      'codigo_erro', 'VERSAO_NAO_ENCONTRADA'
    );
  END IF;
  
  -- Verificar se esta versão específica já foi retirada
  IF EXISTS (SELECT 1 FROM public.retiradas_amostras WHERE codigo_amostra = p_codigo_versao) THEN
    RETURN jsonb_build_object(
      'sucesso', false,
      'erro', 'Esta versão já foi retirada anteriormente: ' || p_codigo_versao,
      'codigo_erro', 'VERSAO_JA_RETIRADA'
    );
  END IF;
  
  -- Validar retirada sequencial
  SELECT validar_retirada_sequencial(p_codigo_versao, v_amostra_id) INTO v_validacao_sequencial;
  
  IF (v_validacao_sequencial->>'valido')::boolean = false THEN
    RETURN jsonb_build_object(
      'sucesso', false,
      'erro', v_validacao_sequencial->>'erro',
      'codigo_erro', 'SEQUENCIA_INVALIDA'
    );
  END IF;
  
  -- Verificar se a amostra está em status válido para retirada
  IF v_amostra_status IN ('cancelado', 'finalizado', 'retirada') THEN
    RETURN jsonb_build_object(
      'sucesso', false,
      'erro', 'Amostra não pode ser retirada devido ao status atual: ' || v_amostra_status,
      'codigo_erro', 'STATUS_INVALIDO'
    );
  END IF;
  
  -- Registrar a retirada com o código de versão
  INSERT INTO public.retiradas_amostras (
    amostra_id,
    codigo_amostra,
    usuario_retirada,
    status_textual,
    metodo_identificacao,
    observacoes,
    ip_address,
    user_agent,
    quantidade_retirada
  ) VALUES (
    v_amostra_id,
    p_codigo_versao,
    p_usuario,
    p_status_textual,
    p_metodo,
    p_observacoes,
    p_ip_address,
    p_user_agent,
    p_quantidade_retirada
  ) RETURNING id INTO v_retirada_id;
  
  -- Marcar a versão específica como realizada no cronograma
  UPDATE public.cronograma_retiradas 
  SET 
    realizada = true,
    data_realizada = CURRENT_DATE,
    usuario_retirada = p_usuario,
    quantidade_retirada = COALESCE(p_quantidade_retirada, 1),
    observacoes = COALESCE(observacoes, '') || ' | Retirada: ' || p_status_textual,
    updated_at = now()
  WHERE id = v_cronograma_id;
  
  -- Verificar se todas as versões da amostra foram retiradas
  IF NOT EXISTS (
    SELECT 1 FROM cronograma_retiradas 
    WHERE amostra_id = v_amostra_id 
    AND (realizada IS FALSE OR realizada IS NULL)
  ) THEN
    -- Se todas as versões foram retiradas, atualizar status da amostra para "retirada"
    UPDATE public.amostras 
    SET status = 'retirada', updated_at = now()
    WHERE id = v_amostra_id;
    
    -- Registrar no histórico de status
    INSERT INTO public.historico_status_amostras (
      amostra_id,
      status_anterior,
      status_novo,
      justificativa,
      usuario_alteracao
    ) VALUES (
      v_amostra_id,
      v_amostra_status,
      'retirada',
      'Todas as versões da amostra foram retiradas - Última versão: ' || p_codigo_versao,
      p_usuario
    );
  END IF;
  
  RETURN jsonb_build_object(
    'sucesso', true,
    'retirada_id', v_retirada_id,
    'cronograma_id', v_cronograma_id,
    'codigo_versao', p_codigo_versao,
    'codigo_base', v_codigo_base,
    'mensagem', 'Retirada da versão ' || p_codigo_versao || ' registrada com sucesso'
  );
END;
$function$