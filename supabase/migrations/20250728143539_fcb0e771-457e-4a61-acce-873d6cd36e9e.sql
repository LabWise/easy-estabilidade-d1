CREATE OR REPLACE FUNCTION public.validar_retirada_sequencial(p_codigo_versao character varying, p_amostra_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
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
$function$