-- Migration to align amostras table with user provided schema

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- amostra_extra
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'amostra_extra') THEN
        ALTER TABLE public.amostras ADD COLUMN amostra_extra boolean DEFAULT false;
    END IF;

    -- nome_produto
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'nome_produto') THEN
        ALTER TABLE public.amostras ADD COLUMN nome_produto VARCHAR NULL;
    END IF;

    -- fabricante
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'fabricante') THEN
        ALTER TABLE public.amostras ADD COLUMN fabricante VARCHAR NULL;
    END IF;

    -- cliente
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'cliente') THEN
        ALTER TABLE public.amostras ADD COLUMN cliente VARCHAR NULL;
    END IF;

    -- numero_pedido
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'numero_pedido') THEN
        ALTER TABLE public.amostras ADD COLUMN numero_pedido VARCHAR NULL;
    END IF;

    -- data_pedido
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'data_pedido') THEN
        ALTER TABLE public.amostras ADD COLUMN data_pedido DATE NULL;
    END IF;

    -- numero_projeto
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'numero_projeto') THEN
        ALTER TABLE public.amostras ADD COLUMN numero_projeto TEXT NULL;
    END IF;

    -- numero_proposta
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'numero_proposta') THEN
        ALTER TABLE public.amostras ADD COLUMN numero_proposta VARCHAR NULL;
    END IF;

    -- motivo_analise
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'motivo_analise') THEN
        ALTER TABLE public.amostras ADD COLUMN motivo_analise TEXT NULL;
    END IF;

    -- empresa_id (should exist, but ensuring default and not null)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'empresa_id') THEN
        ALTER TABLE public.amostras ADD COLUMN empresa_id BIGINT NOT NULL DEFAULT get_current_user_empresa_id();
        -- Add FK if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'amostras_empresa_id_fkey') THEN
            ALTER TABLE public.amostras ADD CONSTRAINT amostras_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id);
        END IF;
    ELSE
        -- Ensure default value is set
        ALTER TABLE public.amostras ALTER COLUMN empresa_id SET DEFAULT get_current_user_empresa_id();
    END IF;

    -- tipo_registro
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'tipo_registro') THEN
        ALTER TABLE public.amostras ADD COLUMN tipo_registro VARCHAR NULL DEFAULT 'pre-registro';
        -- Add Check constraint
        ALTER TABLE public.amostras ADD CONSTRAINT amostras_tipo_registro_check CHECK (tipo_registro::text = ANY (ARRAY['pre-registro'::text, 'pos-registro'::text]));
    END IF;

    -- concentracao_produto
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'concentracao_produto') THEN
        ALTER TABLE public.amostras ADD COLUMN concentracao_produto TEXT NULL;
    END IF;

    -- tamanho_lote
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'tamanho_lote') THEN
        ALTER TABLE public.amostras ADD COLUMN tamanho_lote TEXT NULL;
    END IF;

    -- material_acondicionamento
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'material_acondicionamento') THEN
        ALTER TABLE public.amostras ADD COLUMN material_acondicionamento TEXT NULL;
    END IF;

    -- metodologia_revisao
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'metodologia_revisao') THEN
        ALTER TABLE public.amostras ADD COLUMN metodologia_revisao TEXT NULL;
    END IF;

    -- endereco_fabricante
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'endereco_fabricante') THEN
        ALTER TABLE public.amostras ADD COLUMN endereco_fabricante TEXT NULL;
    END IF;

    -- termino_estudo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'termino_estudo') THEN
        ALTER TABLE public.amostras ADD COLUMN termino_estudo DATE NULL;
    END IF;

    -- no_projeto_input
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'no_projeto_input') THEN
        ALTER TABLE public.amostras ADD COLUMN no_projeto_input TEXT NULL;
    END IF;

    -- produto_controlado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'produto_controlado') THEN
        ALTER TABLE public.amostras ADD COLUMN produto_controlado BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- qtd_controlado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'qtd_controlado') THEN
        ALTER TABLE public.amostras ADD COLUMN qtd_controlado NUMERIC NULL;
    END IF;

    -- un_controlado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'un_controlado') THEN
        ALTER TABLE public.amostras ADD COLUMN un_controlado UUID NULL;
        -- Add FK
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'amostras_un_controlado_fkey') THEN
            ALTER TABLE public.amostras ADD CONSTRAINT amostras_un_controlado_fkey FOREIGN KEY (un_controlado) REFERENCES unidades(id);
        END IF;
    END IF;

    -- tipo_controlado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'tipo_controlado') THEN
        ALTER TABLE public.amostras ADD COLUMN tipo_controlado UUID NULL;
        -- Add FK
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'amostras_tipo_controlado_fkey') THEN
            ALTER TABLE public.amostras ADD CONSTRAINT amostras_tipo_controlado_fkey FOREIGN KEY (tipo_controlado) REFERENCES produtos(id);
        END IF;
    END IF;

    -- Alter existing columns to be nullable if needed (based on user schema)
    
    -- equipamento_id (uuid null in user schema)
    ALTER TABLE public.amostras ALTER COLUMN equipamento_id DROP NOT NULL;

    -- data_fabricacao (date null in user schema)
    ALTER TABLE public.amostras ALTER COLUMN data_fabricacao DROP NOT NULL;

    -- data_vencimento (date null in user schema)
    ALTER TABLE public.amostras ALTER COLUMN data_vencimento DROP NOT NULL;

    -- produto_id (exists in DB but not in user schema, causing Not Null violation on insert)
    -- Making it nullable to support legacy data while allowing new inserts without it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostras' AND column_name = 'produto_id') THEN
        ALTER TABLE public.amostras ALTER COLUMN produto_id DROP NOT NULL;
    END IF;

END $$;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_amostras_search ON public.amostras USING btree (codigo, nome_produto, lote, empresa_id);
CREATE INDEX IF NOT EXISTS idx_amostras_tipo_estabilidade ON public.amostras USING btree (tipo_estabilidade_id, empresa_id);
CREATE INDEX IF NOT EXISTS idx_amostras_status ON public.amostras USING btree (status, empresa_id);
