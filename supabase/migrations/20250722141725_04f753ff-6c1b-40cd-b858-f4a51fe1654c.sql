
-- Atualizar a função gerar_cronograma_com_versoes para corrigir cálculo de datas
-- e garantir códigos únicos para amostras extras
CREATE OR REPLACE FUNCTION public.gerar_cronograma_com_versoes(
  p_amostra_id uuid, 
  p_codigo_base character varying, 
  p_tipo_sigla character varying, 
  p_data_entrada date
)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  periodo_record RECORD;
  versao_num INTEGER := 1;
  data_programada DATE;
  tipo_estabilidade_record RECORD;
  periodos_json jsonb;
  meses_extraidos INTEGER;
  dia_original INTEGER;
  mes_destino INTEGER;
  ano_destino INTEGER;
  ultimo_dia_mes INTEGER;
BEGIN
  -- Buscar os períodos configurados para o tipo de estabilidade
  SELECT periodos_retirada INTO periodos_json
  FROM tipos_estabilidade 
  WHERE sigla = p_tipo_sigla AND ativo = true;
  
  -- Verificar se encontrou o tipo e se tem períodos configurados
  IF periodos_json IS NULL THEN
    RETURN;
  END IF;
  
  -- Verificar se periodos_retirada é um array válido e não está vazio
  IF jsonb_typeof(periodos_json) != 'array' OR jsonb_array_length(periodos_json) = 0 THEN
    RETURN;
  END IF;
  
  -- Extrair o dia original da data de entrada
  dia_original := EXTRACT(DAY FROM p_data_entrada);
  
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
    -- Extrair o número de meses do período (ex: "3M" -> 3)
    IF periodo_record.periodo ~ '\d+M' THEN
      meses_extraidos := CAST(substring(periodo_record.periodo from '\d+') AS INTEGER);
      
      -- Calcular ano e mês de destino
      mes_destino := EXTRACT(MONTH FROM p_data_entrada) + meses_extraidos;
      ano_destino := EXTRACT(YEAR FROM p_data_entrada);
      
      -- Ajustar ano se necessário
      WHILE mes_destino > 12 LOOP
        mes_destino := mes_destino - 12;
        ano_destino := ano_destino + 1;
      END LOOP;
      
      -- Verificar último dia do mês de destino
      ultimo_dia_mes := EXTRACT(DAY FROM (DATE(ano_destino || '-' || mes_destino || '-01') + INTERVAL '1 month - 1 day'));
      
      -- Se o dia original não existe no mês de destino, usar dia 1 do mês seguinte
      IF dia_original > ultimo_dia_mes THEN
        mes_destino := mes_destino + 1;
        IF mes_destino > 12 THEN
          mes_destino := 1;
          ano_destino := ano_destino + 1;
        END IF;
        data_programada := DATE(ano_destino || '-' || mes_destino || '-01');
      ELSE
        data_programada := DATE(ano_destino || '-' || mes_destino || '-' || dia_original);
      END IF;
    ELSE
      -- Fallback para períodos que não seguem o padrão "XM"
      data_programada := p_data_entrada + (periodo_record.dias * INTERVAL '1 day');
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

-- Atualizar a função do serviço de amostras para adicionar versão extra com código único
CREATE OR REPLACE FUNCTION public.adicionar_versao_extra_com_codigo_unico(
  p_amostra_id uuid,
  p_codigo_base character varying,
  p_data_entrada date
)
RETURNS void
LANGUAGE plpgsql
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
