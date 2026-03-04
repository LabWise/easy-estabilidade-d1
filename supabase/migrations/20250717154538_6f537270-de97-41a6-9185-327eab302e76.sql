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
  empresa_id,
  analisado_por,
  status_analise,
  data_hora_inicio_analise,
  data_hora_conclusao_analise,
  resultado_analise
)
SELECT DISTINCT
  saa.amostra_id,
  saa.tipo_analise_id,
  NULL as codigo_subamostra_id, -- será atualizado depois
  saa.empresa_id,
  saa.usuario_analista,
  CASE 
    WHEN saa.status = 'pendente' THEN 'Pendente'::status_analise
    WHEN saa.status = 'em_andamento' THEN 'Em Análise'::status_analise
    WHEN saa.status = 'concluido' THEN 'Concluído'::status_analise
    ELSE 'Pendente'::status_analise
  END,
  saa.data_inicio,
  saa.data_conclusao,
  saa.resultados
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

-- 5. Remover campos de workflow de amostra_analises (agora movidos para status_analises_amostras)
ALTER TABLE amostra_analises 
DROP COLUMN IF EXISTS analisado_por,
DROP COLUMN IF EXISTS status_analise,
DROP COLUMN IF EXISTS data_hora_inicio_analise,
DROP COLUMN IF EXISTS data_hora_conclusao_analise,
DROP COLUMN IF EXISTS resultado_analise;

-- 6. Criar índices para performance
CREATE INDEX idx_amostra_analises_amostra_tipo ON amostra_analises(amostra_id, tipo_analise_id);
CREATE INDEX idx_amostra_analises_codigo_subamostra ON amostra_analises(codigo_subamostra_id);
CREATE INDEX idx_status_analises_amostra_analise ON status_analises_amostras(amostra_analise_id);

-- 7. Adicionar constraint única para evitar duplicatas
ALTER TABLE amostra_analises 
ADD CONSTRAINT unique_amostra_tipo_subamostra 
UNIQUE (amostra_id, tipo_analise_id, codigo_subamostra_id);