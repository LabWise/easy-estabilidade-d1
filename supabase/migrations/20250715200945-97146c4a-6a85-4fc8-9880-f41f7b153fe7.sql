-- Criar função para registrar logins de usuários
CREATE OR REPLACE FUNCTION public.log_user_authentication()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_usuario_id uuid;
  v_empresa_id bigint;
  v_usuario_nome text;
  v_usuario_email text;
BEGIN
  -- Verificar se houve mudança no last_sign_in_at (indicando novo login)
  IF OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at AND NEW.last_sign_in_at IS NOT NULL THEN
    
    -- Buscar dados do usuário na tabela usuarios
    SELECT id, empresa_id, nome, email 
    INTO v_usuario_id, v_empresa_id, v_usuario_nome, v_usuario_email
    FROM public.usuarios 
    WHERE auth_id = NEW.id;
    
    -- Se encontrou o usuário, registrar o log
    IF v_usuario_id IS NOT NULL THEN
      INSERT INTO public.logs_auditoria (
        empresa_id,
        usuario_id,
        acao,
        tabela,
        registro_id,
        dados_antes,
        dados_depois,
        ip
      ) VALUES (
        v_empresa_id,
        v_usuario_id,
        'login',
        'auth.users',
        NEW.id::text,
        NULL,
        jsonb_build_object(
          'user_id', NEW.id,
          'email', COALESCE(v_usuario_email, NEW.email),
          'nome', v_usuario_nome,
          'last_sign_in_at', NEW.last_sign_in_at,
          'created_at', NEW.created_at
        ),
        NULL
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Criar trigger para monitorar logins
DROP TRIGGER IF EXISTS on_user_login ON auth.users;
CREATE TRIGGER on_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.log_user_authentication();