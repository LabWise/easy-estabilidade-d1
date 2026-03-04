
-- Adicionar campo amostra_extra à tabela amostras
ALTER TABLE public.amostras 
ADD COLUMN amostra_extra boolean DEFAULT false;
