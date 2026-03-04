
-- Adicionar coluna para código versionado na tabela cronograma_retiradas
ALTER TABLE cronograma_retiradas ADD COLUMN codigo_versao VARCHAR;

-- Criar função para gerar códigos versionados automaticamente
CREATE OR REPLACE FUNCTION gerar_cronograma_com_versoes(
  p_amostra_id UUID,
  p_codigo_base VARCHAR,
  p_tipo_sigla VARCHAR,
  p_data_entrada DATE
) RETURNS VOID AS $$
DECLARE
  periodo_record RECORD;
  versao_num INTEGER := 1;
  data_programada DATE;
BEGIN
  -- Definir períodos baseado no tipo de estabilidade
  IF p_tipo_sigla = 'AC' THEN
    -- Acelerada: 3M, 6M
    FOR periodo_record IN 
      VALUES ('3M', 90), ('6M', 180)
    LOOP
      data_programada := p_data_entrada + (periodo_record.column2 * INTERVAL '1 day');
      
      INSERT INTO cronograma_retiradas (
        amostra_id,
        codigo_versao,
        tempo_coleta,
        data_programada,
        realizada
      ) VALUES (
        p_amostra_id,
        p_codigo_base || '.' || versao_num,
        periodo_record.column1,
        data_programada,
        false
      );
      
      versao_num := versao_num + 1;
    END LOOP;
    
  ELSIF p_tipo_sigla = 'LD' THEN
    -- Longa Duração: 3M, 6M, 9M, 12M, 18M, 24M, 36M
    FOR periodo_record IN 
      VALUES ('3M', 90), ('6M', 180), ('9M', 270), ('12M', 360), ('18M', 540), ('24M', 720), ('36M', 1080)
    LOOP
      data_programada := p_data_entrada + (periodo_record.column2 * INTERVAL '1 day');
      
      INSERT INTO cronograma_retiradas (
        amostra_id,
        codigo_versao,
        tempo_coleta,
        data_programada,
        realizada
      ) VALUES (
        p_amostra_id,
        p_codigo_base || '.' || versao_num,
        periodo_record.column1,
        data_programada,
        false
      );
      
      versao_num := versao_num + 1;
    END LOOP;
    
  ELSIF p_tipo_sigla = 'AP' THEN
    -- Acompanhamento: 12M, 24M, 36M
    FOR periodo_record IN 
      VALUES ('12M', 360), ('24M', 720), ('36M', 1080)
    LOOP
      data_programada := p_data_entrada + (periodo_record.column2 * INTERVAL '1 day');
      
      INSERT INTO cronograma_retiradas (
        amostra_id,
        codigo_versao,
        tempo_coleta,
        data_programada,
        realizada
      ) VALUES (
        p_amostra_id,
        p_codigo_base || '.' || versao_num,
        periodo_record.column1,
        data_programada,
        false
      );
      
      versao_num := versao_num + 1;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;
