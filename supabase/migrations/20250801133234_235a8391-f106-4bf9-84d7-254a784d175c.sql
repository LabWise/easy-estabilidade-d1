-- Fase 2A: Correção das funções RLS

-- 1. Remover políticas conflitantes na tabela usuarios
DROP POLICY IF EXISTS "Usuarios comuns nao podem atualizar perfis (RLS)" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios comuns nao podem atualizar perfis RLS" ON public.usuarios;

-- 2. Fortalecer função get_user_profile_type() para lidar com auth.uid() null
CREATE OR REPLACE FUNCTION public.get_user_profile_type()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT profile_type::text FROM public.usuarios WHERE auth_id = auth.uid()),
    'analista_de_laboratorio'
  );
$function$;

-- 3. Fortalecer função get_current_user_empresa_id() para lidar com auth.uid() null
CREATE OR REPLACE FUNCTION public.get_current_user_empresa_id()
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT empresa_id FROM public.usuarios WHERE auth_id = auth.uid()),
    1::bigint
  );
$function$;