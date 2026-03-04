-- Security Fix: Remove unused perfis_de_usuario view that poses security risk
-- This view has no RLS protection and is not used in the application
-- Dropping it eliminates the security vulnerability

DROP VIEW IF EXISTS public.perfis_de_usuario;