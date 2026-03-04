-- Corrigir o problema de search_path mutável em todas as funções
-- Adicionando SET search_path TO 'public' para segurança

-- 1. get_user_profile_type (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_user_profile_type()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT profile_type FROM public.usuarios WHERE id = auth.uid();
$function$;

-- 2. gerar_proximo_codigo_amostra
CREATE OR REPLACE FUNCTION public.gerar_proximo_codigo_amostra()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    empresa_id_atual bigint;
    proximo_codigo TEXT;
BEGIN
    -- Obter empresa_id do usuário atual
    SELECT get_current_user_empresa_id() INTO empresa_id_atual;
    
    -- Se não conseguir obter empresa_id, usar fallback com timestamp
    IF empresa_id_atual IS NULL THEN
        proximo_codigo := 'EST' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
        RETURN proximo_codigo;
    END IF;
    
    -- Usar função específica por empresa
    SELECT gerar_proximo_codigo_amostra_por_empresa(empresa_id_atual) INTO proximo_codigo;
    
    RETURN proximo_codigo;
END;
$function$;

-- 3. debug_auth_uid (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.debug_auth_uid()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT auth.uid();
$function$;

-- 4. validate_user_update (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.validate_user_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_empresa_id bigint;
  admin_profile_type text;
BEGIN
  -- Obter o empresa_id e profile_type do administrador que está realizando a operação
  SELECT empresa_id, profile_type INTO admin_empresa_id, admin_profile_type
  FROM public.usuarios
  WHERE id = auth.uid();

  -- Se não for um administrador, ou se a função não conseguir determinar o administrador, negar
  IF admin_profile_type IS DISTINCT FROM 'administrador' THEN
    RAISE EXCEPTION 'Apenas administradores podem atualizar usuários.';
  END IF;

  -- Validar que o usuário sendo atualizado pertence à mesma empresa do administrador
  IF OLD.empresa_id IS DISTINCT FROM admin_empresa_id THEN
    RAISE EXCEPTION 'Administradores podem atualizar usuários apenas de sua própria empresa.';
  END IF;

  -- Validar que o empresa_id do usuário não está sendo alterado para fora da empresa do administrador
  IF NEW.empresa_id IS DISTINCT FROM admin_empresa_id THEN
    RAISE EXCEPTION 'O ID da empresa do usuário não pode ser alterado para fora da empresa do administrador.';
  END IF;

  -- Validar que o profile_type não está sendo alterado (exceto se você tiver uma regra específica para isso)
  IF NEW.profile_type IS DISTINCT FROM OLD.profile_type THEN
    RAISE EXCEPTION 'O tipo de perfil (profile_type) não pode ser alterado por administradores.';
  END IF;

  RETURN NEW; -- Retorna NEW para permitir a atualização
END;
$function$;

-- 5. validate_user_insert (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.validate_user_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_empresa_id bigint;
  admin_profile_type text;
BEGIN
  -- Obter o empresa_id e profile_type do administrador que está realizando a operação
  SELECT empresa_id, profile_type INTO admin_empresa_id, admin_profile_type
  FROM public.usuarios
  WHERE id = auth.uid();

  -- Se não for um administrador, ou se a função não conseguir determinar o administrador, negar
  IF admin_profile_type IS DISTINCT FROM 'administrador' THEN
    RAISE EXCEPTION 'Apenas administradores podem criar novos usuários.';
  END IF;

  -- Validar que o novo usuário pertence à mesma empresa do administrador
  IF NEW.empresa_id IS DISTINCT FROM admin_empresa_id THEN
    RAISE EXCEPTION 'Administradores podem criar usuários apenas para sua própria empresa.';
  END IF;

  RETURN NEW; -- Retorna NEW para permitir a inserção
END;
$function$;

-- 6. get_current_user_empresa_id (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_current_user_empresa_id()
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT empresa_id FROM public.usuarios WHERE auth_id = auth.uid();
$function$;

-- 7. validar_retirada_sequencial
CREATE OR REPLACE FUNCTION public.validar_retirada_sequencial(p_codigo_versao character varying, p_amostra_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_numero_versao INTEGER;
  v_codigo_base VARCHAR;
  v_ultima_versao_retirada INTEGER := 0;
  v_versao_anterior VARCHAR;
  v_periodo_tempo VARCHAR;
  v_tempo_coleta_atual VARCHAR;
BEGIN
  -- Extrair número da versão do código (ex: EST2500003.2 -> 2)
  v_codigo_base := SPLIT_PART(p_codigo_versao, '.', 1);
  v_numero_versao := CAST(SPLIT_PART(p_codigo_versao, '.', 2) AS INTEGER);
  
  -- Verificar se a versão atual é do tipo "Extra"
  SELECT tempo_coleta INTO v_tempo_coleta_atual
  FROM cronograma_retiradas 
  WHERE amostra_id = p_amostra_id 
  AND codigo_versao = p_codigo_versao
  LIMIT 1;
  
  -- Se for versão extra, sempre permitir retirada
  IF v_tempo_coleta_atual = 'Extra' OR v_tempo_coleta_atual = 'extra' THEN
    RETURN jsonb_build_object('valido', true);
  END IF;
  
  -- Buscar a última versão retirada desta amostra (excluindo versões extras)
  SELECT COALESCE(MAX(CAST(SPLIT_PART(ra.codigo_amostra, '.', 2) AS INTEGER)), 0)
  INTO v_ultima_versao_retirada
  FROM retiradas_amostras ra
  JOIN cronograma_retiradas cr ON cr.codigo_versao = ra.codigo_amostra AND cr.amostra_id = ra.amostra_id
  WHERE ra.amostra_id = p_amostra_id
  AND (cr.tempo_coleta != 'Extra' AND cr.tempo_coleta != 'extra');
  
  -- Verificar se a versão atual é a próxima na sequência
  IF v_numero_versao != (v_ultima_versao_retirada + 1) THEN
    -- Se não é a primeira versão (1) e não é a próxima na sequência
    IF v_ultima_versao_retirada = 0 AND v_numero_versao != 1 THEN
      -- Buscar o período de tempo da primeira versão
      SELECT tempo_coleta INTO v_periodo_tempo
      FROM cronograma_retiradas 
      WHERE amostra_id = p_amostra_id 
      AND codigo_versao = v_codigo_base || '.1'
      LIMIT 1;
      
      RETURN jsonb_build_object(
        'valido', false,
        'erro', 'Retire primeiro a amostra ' || v_codigo_base || '.1 para estudo de ' || COALESCE(v_periodo_tempo, '1M')
      );
    ELSIF v_ultima_versao_retirada > 0 THEN
      v_versao_anterior := v_codigo_base || '.' || (v_ultima_versao_retirada + 1);
      
      -- Buscar o período de tempo da próxima versão
      SELECT tempo_coleta INTO v_periodo_tempo
      FROM cronograma_retiradas 
      WHERE amostra_id = p_amostra_id 
      AND codigo_versao = v_versao_anterior
      LIMIT 1;
      
      RETURN jsonb_build_object(
        'valido', false,
        'erro', 'Retire primeiro a amostra ' || v_versao_anterior || ' para estudo de ' || COALESCE(v_periodo_tempo, 'tempo indefinido')
      );
    END IF;
  END IF;
  
  RETURN jsonb_build_object('valido', true);
END;
$function$;

-- 8. adicionar_versao_extra_com_codigo_unico
CREATE OR REPLACE FUNCTION public.adicionar_versao_extra_com_codigo_unico(p_amostra_id uuid, p_codigo_base character varying, p_data_entrada date)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  ultima_versao_num INTEGER;
  nova_versao_num INTEGER;
  data_extra DATE;
BEGIN
  -- Buscar o maior número de versão existente para esta amostra
  SELECT COALESCE(
    MAX(CAST(SPLIT_PART(codigo_versao, '.', 2) AS INTEGER)), 
    0
  ) INTO ultima_versao_num
  FROM cronograma_retiradas
  WHERE amostra_id = p_amostra_id;
  
  -- Calcular nova versão (próximo número disponível)
  nova_versao_num := ultima_versao_num + 1;
  
  -- Buscar a data da última versão para calcular data extra
  SELECT data_programada INTO data_extra
  FROM cronograma_retiradas
  WHERE amostra_id = p_amostra_id
  ORDER BY data_programada DESC
  LIMIT 1;
  
  -- Se não encontrou data, usar data de entrada + 1 dia
  IF data_extra IS NULL THEN
    data_extra := p_data_entrada + INTERVAL '1 day';
  ELSE
    data_extra := data_extra + INTERVAL '1 day';
  END IF;
  
  -- Inserir nova versão extra
  INSERT INTO cronograma_retiradas (
    amostra_id,
    codigo_versao,
    tempo_coleta,
    data_programada,
    realizada
  ) VALUES (
    p_amostra_id,
    p_codigo_base || '.' || nova_versao_num,
    'Extra',
    data_extra,
    false
  );
END;
$function$;

-- 9. validar_retirada_amostra
CREATE OR REPLACE FUNCTION public.validar_retirada_amostra(p_codigo_versao character varying, p_usuario character varying, p_status_textual character varying, p_metodo character varying, p_observacoes text DEFAULT NULL::text, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text)
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
    user_agent
  ) VALUES (
    v_amostra_id,
    p_codigo_versao,
    p_usuario,
    p_status_textual,
    p_metodo,
    p_observacoes,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_retirada_id;
  
  -- Marcar a versão específica como realizada no cronograma
  UPDATE public.cronograma_retiradas 
  SET 
    realizada = true,
    data_realizada = CURRENT_DATE,
    usuario_retirada = p_usuario,
    quantidade_retirada = 1,
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
$function$;

-- 10. gerar_cronograma_com_versoes
CREATE OR REPLACE FUNCTION public.gerar_cronograma_com_versoes(p_amostra_id uuid, p_codigo_base character varying, p_tipo_sigla character varying, p_data_entrada date)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  periodo_record RECORD;
  versao_num INTEGER := 1;
  data_programada DATE;
  tipo_estabilidade_record RECORD;
  periodos_json jsonb;
  meses_calculados NUMERIC;
BEGIN
  -- Buscar os períodos configurados para o tipo de estabilidade
  SELECT periodos_retirada INTO periodos_json
  FROM tipos_estabilidade 
  WHERE sigla = p_tipo_sigla AND ativo = true;
  
  -- Verificar se encontrou o tipo e se tem períodos configurados
  IF periodos_json IS NULL THEN
    -- Se não encontrou períodos configurados, não gerar cronograma
    RETURN;
  END IF;
  
  -- Verificar se periodos_retirada é um array válido e não está vazio
  IF jsonb_typeof(periodos_json) != 'array' OR jsonb_array_length(periodos_json) = 0 THEN
    -- Se não é um array ou está vazio, não gerar cronograma
    RETURN;
  END IF;
  
  -- Iterar pelos períodos configurados no JSON
  FOR periodo_record IN 
    SELECT 
      periodo_data->>'periodo' as periodo,
      (periodo_data->>'dias')::integer as dias
    FROM jsonb_array_elements(periodos_json) as periodo_data
    WHERE periodo_data->>'periodo' IS NOT NULL 
      AND periodo_data->>'dias' IS NOT NULL
      AND (periodo_data->>'dias')::integer > 0
  LOOP
    -- Calcular data programada baseada no tipo de período
    IF periodo_record.periodo ~ '\d+M' THEN
      -- Extrair o número de meses do período (ex: "3M" -> 3)
      meses_calculados := CAST(substring(periodo_record.periodo from '\d+') AS INTEGER);
      data_programada := p_data_entrada + (meses_calculados * INTERVAL '1 month');
    ELSE
      -- Para períodos como "Micro" ou outros que não seguem o padrão "XM"
      -- Calcular meses baseado nos dias configurados (dias / 30.44)
      meses_calculados := ROUND(periodo_record.dias / 30.44);
      data_programada := p_data_entrada + (meses_calculados * INTERVAL '1 month');
    END IF;
    
    INSERT INTO cronograma_retiradas (
      amostra_id,
      codigo_versao,
      tempo_coleta,
      data_programada,
      realizada
    ) VALUES (
      p_amostra_id,
      p_codigo_base || '.' || versao_num,
      periodo_record.periodo,
      data_programada,
      false
    );
    
    versao_num := versao_num + 1;
  END LOOP;
END;
$function$;