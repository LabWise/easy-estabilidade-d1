
-- Tornar o campo data_vencimento opcional na tabela amostras
ALTER TABLE amostras ALTER COLUMN data_vencimento DROP NOT NULL;

-- Tornar o campo data_fabricacao opcional na tabela amostras  
ALTER TABLE amostras ALTER COLUMN data_fabricacao DROP NOT NULL;

-- Tornar o campo equipamento_id opcional na tabela amostras
ALTER TABLE amostras ALTER COLUMN equipamento_id DROP NOT NULL;
