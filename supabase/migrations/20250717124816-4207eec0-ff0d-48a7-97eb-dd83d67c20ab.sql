-- Corrigir política RLS para tipos_analise para permitir acesso aos tipos globais
DROP POLICY IF EXISTS "Company data access for tipos_analise" ON tipos_analise;

-- Criar nova política que permite acesso aos tipos da empresa E aos tipos globais
CREATE POLICY "Company and global data access for tipos_analise" 
ON tipos_analise 
FOR ALL 
USING (empresa_id = get_current_user_empresa_id() OR empresa_id IS NULL)
WITH CHECK (empresa_id = get_current_user_empresa_id() OR empresa_id IS NULL);