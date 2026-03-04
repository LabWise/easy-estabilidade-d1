
-- Atualizar a função gerar_cronograma_com_versoes para calcular datas baseadas em meses
-- em vez de dias, mantendo consistência com o frontend
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
    -- Extrair o número de meses do período (ex: "3M" -> 3)
    -- Se o período contém 'M', extrair o número antes do 'M'
    IF periodo_record.periodo ~ '\d+M' THEN
      meses_extraidos := CAST(substring(periodo_record.periodo from '\d+') AS INTEGER);
      data_programada := p_data_entrada + (meses_extraidos * INTERVAL '1 month');
    ELSE
      -- Fallback para períodos que não seguem o padrão "XM"
      -- Usar o cálculo por dias como estava antes
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
$function$
