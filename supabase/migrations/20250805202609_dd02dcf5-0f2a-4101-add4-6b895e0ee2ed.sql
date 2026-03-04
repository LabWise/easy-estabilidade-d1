-- Adicionar política RLS para tabela unidades
CREATE POLICY "Company data access for unidades" 
ON public.unidades 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);