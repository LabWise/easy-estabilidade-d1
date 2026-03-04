-- Criar índice único na coluna auth_id da tabela usuarios para otimizar consultas
-- Isso transformará Seq Scan em Index Scan instantâneo
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_auth_id 
ON public.usuarios (auth_id) 
WHERE auth_id IS NOT NULL;