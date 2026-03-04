-- Remover constraint antiga que está causando o conflito de relacionamento
-- Verificar se existe e remover amostras_produto_id_fkey se existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'amostras_produto_id_fkey' 
               AND table_name = 'amostras') THEN
        ALTER TABLE public.amostras DROP CONSTRAINT amostras_produto_id_fkey;
        RAISE NOTICE 'Constraint amostras_produto_id_fkey removida com sucesso';
    ELSE
        RAISE NOTICE 'Constraint amostras_produto_id_fkey não encontrada';
    END IF;
END
$$;