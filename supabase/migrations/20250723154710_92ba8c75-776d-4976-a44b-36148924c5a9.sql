-- Add profile_type column to usuarios table
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS profile_type VARCHAR(50) DEFAULT 'analista_de_laboratorio';

-- Update existing users to have a default profile type
UPDATE public.usuarios 
SET profile_type = 'administrador' 
WHERE profile_type IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN public.usuarios.profile_type IS 'Tipo de perfil do usuário: administrador, gestor, analista_de_estabilidade, analista_de_laboratorio';