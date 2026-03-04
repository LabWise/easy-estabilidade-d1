-- Remover as views que estão causando problemas de segurança
DROP VIEW IF EXISTS public.usuarios_publicos;
DROP VIEW IF EXISTS public.usuarios_completos;

-- Manter apenas as políticas RLS na tabela usuarios que já foram criadas
-- As políticas já existentes são suficientes para controlar o acesso