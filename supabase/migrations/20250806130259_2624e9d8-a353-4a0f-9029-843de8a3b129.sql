-- Adicionar campo quantidade_retirada na tabela retiradas_amostras
ALTER TABLE public.retiradas_amostras 
ADD COLUMN quantidade_retirada numeric;