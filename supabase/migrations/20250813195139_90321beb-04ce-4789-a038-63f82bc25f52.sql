-- Remover política atual que permite todos verem todos os usuários
DROP POLICY IF EXISTS "Todos usuarios autenticados podem ver todos os usuarios" ON public.usuarios;

-- Criar view para usuários públicos (campos limitados)
CREATE OR REPLACE VIEW public.usuarios_publicos AS
SELECT 
  id,
  nome,
  profile_type,
  empresa_id,
  ativo,
  created_at
FROM public.usuarios
WHERE ativo = true;

-- Criar view para usuários completos (todos os campos)
CREATE OR REPLACE VIEW public.usuarios_completos AS
SELECT *
FROM public.usuarios;

-- Habilitar RLS nas views
ALTER VIEW public.usuarios_publicos SET (security_barrier = true);
ALTER VIEW public.usuarios_completos SET (security_barrier = true);

-- Política: Usuários podem ver seus próprios dados completos
CREATE POLICY "Users can view their own complete data"
ON public.usuarios
FOR SELECT
TO authenticated
USING (auth.uid() = auth_id);

-- Política: Usuários comuns podem ver dados públicos de outros usuários
CREATE POLICY "Common users can view public user data"
ON public.usuarios
FOR SELECT
TO authenticated
USING (
  get_user_profile_type() IN ('analista_de_estabilidade', 'analista_de_laboratorio')
  AND ativo = true
);

-- Política: Administradores e gestores podem ver todos os dados
CREATE POLICY "Admins and managers can view all user data"
ON public.usuarios
FOR SELECT
TO authenticated
USING (
  get_user_profile_type() IN ('administrador', 'gestor')
);