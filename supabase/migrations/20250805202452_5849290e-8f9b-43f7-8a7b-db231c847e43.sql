-- Criar função para buscar unidades
CREATE OR REPLACE FUNCTION public.get_unidades()
 RETURNS TABLE(id bigint, unidade text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id, unidade 
  FROM public.unidades 
  ORDER BY unidade;
$function$;