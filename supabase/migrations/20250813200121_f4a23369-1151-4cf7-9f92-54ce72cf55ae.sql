-- Security Fix: Enable RLS and add policies for perfis_de_usuario table
-- The perfis_de_usuario table currently has no RLS policies, which is a security vulnerability

-- First, enable RLS on the table
ALTER TABLE public.perfis_de_usuario ENABLE ROW LEVEL SECURITY;

-- Add policy for users to view their own profile data
CREATE POLICY "Users can view their own profile data" 
ON public.perfis_de_usuario 
FOR SELECT 
USING (auth.uid() = auth_id);

-- Add policy for administrators to view all profiles within their company
CREATE POLICY "Administrators can view all profiles in their company" 
ON public.perfis_de_usuario 
FOR SELECT 
USING (
  get_user_profile_type() = 'administrador' 
  AND empresa_id = get_current_user_empresa_id()
);

-- Add policy for administrators to update profiles in their company
CREATE POLICY "Administrators can update profiles in their company" 
ON public.perfis_de_usuario 
FOR UPDATE 
USING (
  get_user_profile_type() = 'administrador' 
  AND empresa_id = get_current_user_empresa_id()
)
WITH CHECK (
  get_user_profile_type() = 'administrador' 
  AND empresa_id = get_current_user_empresa_id()
);

-- Add policy for users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.perfis_de_usuario 
FOR UPDATE 
USING (auth.uid() = auth_id)
WITH CHECK (auth.uid() = auth_id);

-- Add policy for administrators to insert profiles in their company
CREATE POLICY "Administrators can insert profiles in their company" 
ON public.perfis_de_usuario 
FOR INSERT 
WITH CHECK (
  get_user_profile_type() = 'administrador' 
  AND empresa_id = get_current_user_empresa_id()
);

-- Add policy for administrators to delete profiles in their company (except their own)
CREATE POLICY "Administrators can delete profiles in their company" 
ON public.perfis_de_usuario 
FOR DELETE 
USING (
  get_user_profile_type() = 'administrador' 
  AND empresa_id = get_current_user_empresa_id()
  AND auth.uid() != auth_id  -- Prevent self-deletion
);