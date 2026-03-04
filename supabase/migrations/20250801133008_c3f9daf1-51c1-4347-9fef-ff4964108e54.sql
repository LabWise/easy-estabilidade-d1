-- Fase 2: Correção das Políticas RLS e função get_user_profile_type()

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
    (SELECT profile_type FROM public.usuarios WHERE auth_id = auth.uid()),
    'analista_de_laboratorio'::text
  );
$function$;

-- 3. Criar nova função para obter empresa_id com fallback
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

-- 4. Criar política mais robusta para usuarios que previne escalação de privilégios
CREATE POLICY "Usuarios nao podem alterar profile_type"
ON public.usuarios
FOR UPDATE
USING (auth.uid() = auth_id AND OLD.profile_type = NEW.profile_type)
WITH CHECK (auth.uid() = auth_id AND OLD.profile_type = NEW.profile_type);