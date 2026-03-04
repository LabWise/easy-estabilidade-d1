-- Corrigir constraint única em amostra_analises
-- Remover a constraint problemática atual
ALTER TABLE amostra_analises 
DROP CONSTRAINT IF EXISTS unique_amostra_tipo_subamostra;

-- Criar nova constraint única correta
-- Cada subamostra pode ter apenas uma análise de cada tipo
ALTER TABLE amostra_analises 
ADD CONSTRAINT unique_subamostra_tipo_analise 
UNIQUE (codigo_subamostra_id, tipo_analise_id);