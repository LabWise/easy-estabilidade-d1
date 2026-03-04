
-- Atualizar a função gerar_cronograma_com_versoes para usar os períodos configurados no banco
-- em vez de ter lógica hardcoded apenas para AC, LD e AP
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
BEGIN
  -- Buscar os períodos configurados para o tipo de estabilidade
  SELECT periodos_retirada INTO tipo_estabilidade_record
  FROM tipos_estabilidade 
  WHERE sigla = p_tipo_sigla AND ativo = true;
  
  -- Verificar se encontrou o tipo e se tem períodos configurados
  IF tipo_estabilidade_record IS NULL OR tipo_estabilidade_record.periodos_retirada IS NULL THEN
    -- Se não encontrou períodos configurados, não gerar cronograma
    RETURN;
  END IF;
  
  -- Iterar pelos períodos configurados no JSON
  FOR periodo_record IN 
    SELECT 
      periodo_data->>'periodo' as periodo,
      (periodo_data->>'dias')::integer as dias
    FROM jsonb_array_elements(tipo_estabilidade_record.periodos_retirada) as periodo_data
    WHERE periodo_data->>'periodo' IS NOT NULL 
      AND periodo_data->>'dias' IS NOT NULL
      AND (periodo_data->>'dias')::integer > 0
  LOOP
    data_programada := p_data_entrada + (periodo_record.dias * INTERVAL '1 day');
    
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
