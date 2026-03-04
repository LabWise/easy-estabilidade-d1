-- Refatoração das tabelas amostra_analises e status_analises_amostras
-- Mover campos de workflow de amostra_analises para status_analises_amostras

-- 1. Adicionar amostra_analise_id em status_analises_amostras
ALTER TABLE status_analises_amostras 
ADD COLUMN amostra_analise_id UUID REFERENCES amostra_analises(id) ON DELETE CASCADE;

-- 2. Migrar dados existentes: criar registros em amostra_analises para cada status existente
INSERT INTO amostra_analises (
  amostra_id, 
  tipo_analise_id, 
  codigo_subamostra_id, 
  empresa_id
)
SELECT DISTINCT
  saa.amostra_id,
  saa.tipo_analise_id,
  NULL::uuid as codigo_subamostra_id, -- casting para UUID
  saa.empresa_id
FROM status_analises_amostras saa;

-- 3. Atualizar amostra_analise_id em status_analises_amostras
UPDATE status_analises_amostras 
SET amostra_analise_id = aa.id
FROM amostra_analises aa
WHERE status_analises_amostras.amostra_id = aa.amostra_id 
AND status_analises_amostras.tipo_analise_id = aa.tipo_analise_id;

-- 4. Tornar amostra_analise_id NOT NULL
ALTER TABLE status_analises_amostras 
ALTER COLUMN amostra_analise_id SET NOT NULL;

-- 5. Criar índices para performance
CREATE INDEX idx_amostra_analises_amostra_tipo ON amostra_analises(amostra_id, tipo_analise_id);
CREATE INDEX idx_amostra_analises_codigo_subamostra ON amostra_analises(codigo_subamostra_id);
CREATE INDEX idx_status_analises_amostra_analise ON status_analises_amostras(amostra_analise_id);

-- 6. Adicionar constraint única para evitar duplicatas
ALTER TABLE amostra_analises 
ADD CONSTRAINT unique_amostra_tipo_subamostra 
UNIQUE (amostra_id, tipo_analise_id, codigo_subamostra_id);