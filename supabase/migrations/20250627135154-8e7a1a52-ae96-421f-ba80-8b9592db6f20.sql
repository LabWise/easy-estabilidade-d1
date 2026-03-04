
-- Adicionar novas colunas à tabela amostras
ALTER TABLE public.amostras 
ADD COLUMN nome_produto character varying,
ADD COLUMN fabricante character varying,
ADD COLUMN cliente character varying,
ADD COLUMN numero_pedido character varying,
ADD COLUMN data_pedido date,
ADD COLUMN numero_projeto character varying,
ADD COLUMN numero_proposta character varying,
ADD COLUMN motivo_analise text;

-- Remover a constraint de NOT NULL do produto_id já que agora usaremos nome_produto
ALTER TABLE public.amostras 
ALTER COLUMN produto_id DROP NOT NULL;
