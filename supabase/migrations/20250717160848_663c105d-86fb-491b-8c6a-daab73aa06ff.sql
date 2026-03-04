-- Remover constraint problemática que impede múltiplas análises do mesmo tipo por amostra
-- Esta constraint estava bloqueando a criação de registros em amostra_analises
ALTER TABLE amostra_analises 
DROP CONSTRAINT IF EXISTS amostra_analises_amostra_id_tipo_analise_id_key;