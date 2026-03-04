-- Reverter políticas RLS problemáticas

-- 1. Remover a política problemática que causa recursão infinita
DROP POLICY IF EXISTS "Users can view names from same company" ON public.usuarios;

-- 2. Remover a view se existir
DROP VIEW IF EXISTS public.audit_trail_with_users;

-- 3. As políticas originais já existem, apenas garantir que estão corretas:
-- "Users can read their own data" para SELECT
-- "Users can update their own data" para UPDATE

-- Verificar e recriar se necessário as políticas originais
DROP POLICY IF EXISTS "Users can read their own data" ON public.usuarios;
DROP POLICY IF EXISTS "Users can update their own data" ON public.usuarios;

-- Recriar as políticas originais corretas
CREATE POLICY "Users can read their own data" 
ON public.usuarios 
FOR SELECT 
TO authenticated
USING (auth.uid() = auth_id);

CREATE POLICY "Users can update their own data" 
ON public.usuarios 
FOR UPDATE 
TO authenticated
USING (auth.uid() = auth_id);