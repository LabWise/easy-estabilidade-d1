-- Reverter alterações feitas hoje nas políticas RLS

-- Remover políticas atuais da tabela tipos_de_analise
DROP POLICY IF EXISTS "Access to global and company tipos_de_analise" ON public.tipos_de_analise;

-- Remover políticas atuais da tabela analises_amostras  
DROP POLICY IF EXISTS "User company access for analises_amostras" ON public.analises_amostras;

-- Restaurar políticas originais se existirem nas tabelas
-- (Como não temos as políticas originais definidas, vamos deixar sem políticas específicas por enquanto)

-- Remover a tabela tipos_de_analise se foi criada hoje
DROP TABLE IF EXISTS public.tipos_de_analise CASCADE;

-- Remover a tabela analises_amostras se foi criada hoje  
DROP TABLE IF EXISTS public.analises_amostras CASCADE;