-- Corrigir a função validate_user_insert
CREATE OR REPLACE FUNCTION public.validate_user_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_empresa_id bigint;
  admin_profile_type text;
BEGIN
  -- Buscar o empresa_id e profile_type do administrador que está realizando a operação
  -- CORREÇÃO: usar auth_id ao invés de id
  SELECT empresa_id, profile_type INTO admin_empresa_id, admin_profile_type
  FROM public.usuarios
  WHERE auth_id = auth.uid();

  -- Se não for um administrador, ou se a função não conseguir determinar o administrador, negar
  IF admin_profile_type IS DISTINCT FROM 'administrador' THEN
    RAISE EXCEPTION 'Apenas administradores podem criar novos usuários.';
  END IF;

  -- Validar que o novo usuário pertence à mesma empresa do administrador
  IF NEW.empresa_id IS DISTINCT FROM admin_empresa_id THEN
    RAISE EXCEPTION 'Administradores podem criar usuários apenas para sua própria empresa.';
  END IF;

  RETURN NEW; -- Retorna NEW para permitir a inserção
END;
$function$;

-- Corrigir a função validate_user_update
CREATE OR REPLACE FUNCTION public.validate_user_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_empresa_id bigint;
  admin_profile_type text;
BEGIN
  -- Obter o empresa_id e profile_type do administrador que está realizando a operação
  -- CORREÇÃO: usar auth_id ao invés de id
  SELECT empresa_id, profile_type INTO admin_empresa_id, admin_profile_type
  FROM public.usuarios
  WHERE auth_id = auth.uid();

  -- Se não for um administrador, ou se a função não conseguir determinar o administrador, negar
  IF admin_profile_type IS DISTINCT FROM 'administrador' THEN
    RAISE EXCEPTION 'Apenas administradores podem atualizar usuários.';
  END IF;

  -- Validar que o usuário sendo atualizado pertence à mesma empresa do administrador
  IF OLD.empresa_id IS DISTINCT FROM admin_empresa_id THEN
    RAISE EXCEPTION 'Administradores podem atualizar usuários apenas de sua própria empresa.';
  END IF;

  -- Validar que o empresa_id do usuário não está sendo alterado para fora da empresa do administrador
  IF NEW.empresa_id IS DISTINCT FROM admin_empresa_id THEN
    RAISE EXCEPTION 'O ID da empresa do usuário não pode ser alterado para fora da empresa do administrador.';
  END IF;

  -- Validar que o profile_type não está sendo alterado (exceto se você tiver uma regra específica para isso)
  IF NEW.profile_type IS DISTINCT FROM OLD.profile_type THEN
    RAISE EXCEPTION 'O tipo de perfil (profile_type) não pode ser alterado por administradores.';
  END IF;

  RETURN NEW; -- Retorna NEW para permitir a atualização
END;
$function$;