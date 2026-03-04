-- Atualizar a função validate_user_update para permitir que administradores alterem o profile_type
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
  SELECT empresa_id, profile_type INTO admin_empresa_id, admin_profile_type
  FROM public.usuarios
  WHERE auth_id = auth.uid();

  -- Se não for um administrador, negar a operação
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

  -- REMOVIDO: A validação que impedia alterar profile_type
  -- Administradores agora podem alterar o profile_type de outros usuários

  RETURN NEW; -- Retorna NEW para permitir a atualização
END;
$function$