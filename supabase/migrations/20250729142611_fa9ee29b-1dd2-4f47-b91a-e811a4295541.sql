-- Step 1: Update existing null empresa_id records based on user creation data
-- For amostras table - get empresa_id from logs_auditoria for insert operations
UPDATE amostras 
SET empresa_id = (
  SELECT la.empresa_id 
  FROM logs_auditoria la 
  WHERE la.tabela = 'amostras' 
    AND la.acao = 'insert' 
    AND la.registro_id = amostras.id::text 
    AND la.empresa_id IS NOT NULL
  LIMIT 1
)
WHERE empresa_id IS NULL;

-- For equipamentos table
UPDATE equipamentos 
SET empresa_id = (
  SELECT la.empresa_id 
  FROM logs_auditoria la 
  WHERE la.tabela = 'equipamentos' 
    AND la.acao = 'insert' 
    AND la.registro_id = equipamentos.id::text 
    AND la.empresa_id IS NOT NULL
  LIMIT 1
)
WHERE empresa_id IS NULL;

-- For produtos table
UPDATE produtos 
SET empresa_id = (
  SELECT la.empresa_id 
  FROM logs_auditoria la 
  WHERE la.tabela = 'produtos' 
    AND la.acao = 'insert' 
    AND la.registro_id = produtos.id::text 
    AND la.empresa_id IS NOT NULL
  LIMIT 1
)
WHERE empresa_id IS NULL;

-- For tipos_estabilidade table
UPDATE tipos_estabilidade 
SET empresa_id = (
  SELECT la.empresa_id 
  FROM logs_auditoria la 
  WHERE la.tabela = 'tipos_estabilidade' 
    AND la.acao = 'insert' 
    AND la.registro_id = tipos_estabilidade.id::text 
    AND la.empresa_id IS NOT NULL
  LIMIT 1
)
WHERE empresa_id IS NULL;

-- For tipos_analise table
UPDATE tipos_analise 
SET empresa_id = (
  SELECT la.empresa_id 
  FROM logs_auditoria la 
  WHERE la.tabela = 'tipos_analise' 
    AND la.acao = 'insert' 
    AND la.registro_id = tipos_analise.id::text 
    AND la.empresa_id IS NOT NULL
  LIMIT 1
)
WHERE empresa_id IS NULL;

-- Step 2: For any remaining null records, set to empresa_id = 1 (default)
-- Skip configuracoes_analise due to unique constraint
UPDATE amostras SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE equipamentos SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE produtos SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE tipos_estabilidade SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE tipos_analise SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE cronograma_retiradas SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE retiradas_amostras SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE historico_status_amostras SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE amostra_analises SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE status_analises_amostras SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE status_retirada_configuracoes SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE historico_alteracao_analises SET empresa_id = 1 WHERE empresa_id IS NULL;

-- Special handling for configuracoes_analise - delete null records instead of updating
DELETE FROM configuracoes_analise WHERE empresa_id IS NULL;

-- Step 3: Make empresa_id NOT NULL and set defaults (except configuracoes_analise)
ALTER TABLE amostras 
  ALTER COLUMN empresa_id SET NOT NULL,
  ALTER COLUMN empresa_id SET DEFAULT get_current_user_empresa_id();

ALTER TABLE equipamentos 
  ALTER COLUMN empresa_id SET NOT NULL,
  ALTER COLUMN empresa_id SET DEFAULT get_current_user_empresa_id();

ALTER TABLE produtos 
  ALTER COLUMN empresa_id SET NOT NULL,
  ALTER COLUMN empresa_id SET DEFAULT get_current_user_empresa_id();

ALTER TABLE tipos_estabilidade 
  ALTER COLUMN empresa_id SET NOT NULL,
  ALTER COLUMN empresa_id SET DEFAULT get_current_user_empresa_id();

ALTER TABLE tipos_analise 
  ALTER COLUMN empresa_id SET NOT NULL,
  ALTER COLUMN empresa_id SET DEFAULT get_current_user_empresa_id();

ALTER TABLE cronograma_retiradas 
  ALTER COLUMN empresa_id SET NOT NULL,
  ALTER COLUMN empresa_id SET DEFAULT get_current_user_empresa_id();

ALTER TABLE retiradas_amostras 
  ALTER COLUMN empresa_id SET NOT NULL,
  ALTER COLUMN empresa_id SET DEFAULT get_current_user_empresa_id();

ALTER TABLE historico_status_amostras 
  ALTER COLUMN empresa_id SET NOT NULL,
  ALTER COLUMN empresa_id SET DEFAULT get_current_user_empresa_id();

ALTER TABLE amostra_analises 
  ALTER COLUMN empresa_id SET NOT NULL,
  ALTER COLUMN empresa_id SET DEFAULT get_current_user_empresa_id();

ALTER TABLE status_analises_amostras 
  ALTER COLUMN empresa_id SET NOT NULL,
  ALTER COLUMN empresa_id SET DEFAULT get_current_user_empresa_id();

ALTER TABLE status_retirada_configuracoes 
  ALTER COLUMN empresa_id SET NOT NULL,
  ALTER COLUMN empresa_id SET DEFAULT get_current_user_empresa_id();

ALTER TABLE historico_alteracao_analises 
  ALTER COLUMN empresa_id SET NOT NULL,
  ALTER COLUMN empresa_id SET DEFAULT get_current_user_empresa_id();

-- For configuracoes_analise, only set NOT NULL (it already has unique constraint)
ALTER TABLE configuracoes_analise 
  ALTER COLUMN empresa_id SET NOT NULL,
  ALTER COLUMN empresa_id SET DEFAULT get_current_user_empresa_id();

-- Step 4: Remove duplicate function
DROP FUNCTION IF EXISTS public.get_user_empresa_id();