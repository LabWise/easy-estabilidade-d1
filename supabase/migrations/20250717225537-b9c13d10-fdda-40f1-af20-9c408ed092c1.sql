-- Remove a constraint incorreta que impede múltiplas análises do mesmo tipo para diferentes subamostras
ALTER TABLE public.status_analises_amostras 
DROP CONSTRAINT IF EXISTS unique_amostra_analise;

-- Adiciona a constraint correta que garante que cada amostra_analise_id tenha apenas um status
ALTER TABLE public.status_analises_amostras 
ADD CONSTRAINT unique_status_por_amostra_analise 
UNIQUE (amostra_analise_id);