-- Remover security_barrier das views para corrigir warnings de segurança
ALTER VIEW public.usuarios_publicos RESET (security_barrier);
ALTER VIEW public.usuarios_completos RESET (security_barrier);

-- Recriar as views sem security_barrier mas com RLS nas tabelas base
DROP VIEW IF EXISTS public.usuarios_publicos;
DROP VIEW IF EXISTS public.usuarios_completos;

-- Recriar view para usuários públicos (campos limitados)
CREATE VIEW public.usuarios_publicos AS
SELECT 
  id,
  nome,
  profile_type,
  empresa_id,
  ativo,
  created_at
FROM public.usuarios
WHERE ativo = true;

-- Recriar view para usuários completos (todos os campos)
CREATE VIEW public.usuarios_completos AS
SELECT *
FROM public.usuarios;