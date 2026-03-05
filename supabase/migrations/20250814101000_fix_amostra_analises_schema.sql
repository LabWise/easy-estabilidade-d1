-- Migration to fix amostra_analises schema and triggers
-- Based on user provided schema and ensuring compatibility

-- 0. Create Log Functions (Auditoria) - Assuming they might not exist or need update
CREATE OR REPLACE FUNCTION public.log_insert_amostra_analises()
RETURNS TRIGGER AS $$
DECLARE
  v_auth_id uuid := auth.uid();
  v_usuario_id uuid;
  v_empresa_id bigint;
BEGIN
  SELECT id, empresa_id INTO v_usuario_id, v_empresa_id
  FROM usuarios
  WHERE auth_id = v_auth_id;

  INSERT INTO logs_auditoria (
    empresa_id,
    usuario_id,
    acao,
    tabela,
    registro_id,
    dados_antes,
    dados_depois,
    ip
  )
  VALUES (
    v_empresa_id,
    v_usuario_id,
    'insert',
    'amostra_analises',
    NEW.id::text,
    null,
    to_jsonb(NEW),
    null
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION public.log_update_amostra_analises()
RETURNS TRIGGER AS $$
DECLARE
  v_auth_id uuid := auth.uid();
  v_usuario_id uuid;
  v_empresa_id bigint;
BEGIN
  SELECT id, empresa_id INTO v_usuario_id, v_empresa_id
  FROM usuarios
  WHERE auth_id = v_auth_id;

  INSERT INTO logs_auditoria (
    empresa_id,
    usuario_id,
    acao,
    tabela,
    registro_id,
    dados_antes,
    dados_depois,
    ip
  )
  VALUES (
    v_empresa_id,
    v_usuario_id,
    'update',
    'amostra_analises',
    NEW.id::text,
    to_jsonb(OLD),
    to_jsonb(NEW),
    null
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION public.log_delete_amostra_analises()
RETURNS TRIGGER AS $$
DECLARE
  v_auth_id uuid := auth.uid();
  v_usuario_id uuid;
  v_empresa_id bigint;
BEGIN
  SELECT id, empresa_id INTO v_usuario_id, v_empresa_id
  FROM usuarios
  WHERE auth_id = v_auth_id;

  INSERT INTO logs_auditoria (
    empresa_id,
    usuario_id,
    acao,
    tabela,
    registro_id,
    dados_antes,
    dados_depois,
    ip
  )
  VALUES (
    v_empresa_id,
    v_usuario_id,
    'delete',
    'amostra_analises',
    OLD.id::text,
    to_jsonb(OLD),
    null,
    null
  );

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

DO $$
BEGIN
    -- 1. Create table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.amostra_analises (
        id uuid not null default gen_random_uuid() PRIMARY KEY,
        amostra_id uuid not null,
        tipo_analise_id uuid not null,
        empresa_id bigint null default get_current_user_empresa_id(),
        created_at timestamp with time zone not null default now(),
        updated_at timestamp with time zone not null default now(),
        codigo_subamostra_id uuid null,
        
        CONSTRAINT unique_subamostra_tipo_analise UNIQUE (codigo_subamostra_id, tipo_analise_id),
        CONSTRAINT amostra_analises_amostra_id_fkey FOREIGN KEY (amostra_id) REFERENCES amostras (id),
        CONSTRAINT amostra_analises_codigo_subamostra_id_fkey FOREIGN KEY (codigo_subamostra_id) REFERENCES cronograma_retiradas (id),
        CONSTRAINT amostra_analises_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas (id),
        CONSTRAINT amostra_analises_tipo_analise_id_fkey FOREIGN KEY (tipo_analise_id) REFERENCES tipos_analise (id)
    );

    -- 2. Add columns if they don't exist (for existing table)
    
    -- codigo_subamostra_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amostra_analises' AND column_name = 'codigo_subamostra_id') THEN
        ALTER TABLE public.amostra_analises ADD COLUMN codigo_subamostra_id uuid null;
        -- Add FK
        ALTER TABLE public.amostra_analises ADD CONSTRAINT amostra_analises_codigo_subamostra_id_fkey FOREIGN KEY (codigo_subamostra_id) REFERENCES cronograma_retiradas (id);
    END IF;

    -- empresa_id nullable check
    -- User schema says "empresa_id bigint null default ...", existing might be not null.
    -- Let's make it nullable to match user schema
    ALTER TABLE public.amostra_analises ALTER COLUMN empresa_id DROP NOT NULL;

    -- 3. Constraints
    -- Check unique constraint
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'unique_subamostra_tipo_analise') THEN
        -- If old constraint exists, drop it
        ALTER TABLE public.amostra_analises DROP CONSTRAINT IF EXISTS unique_amostra_tipo_subamostra;
        ALTER TABLE public.amostra_analises ADD CONSTRAINT unique_subamostra_tipo_analise UNIQUE (codigo_subamostra_id, tipo_analise_id);
    END IF;

END $$;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_amostra_analises_amostra_tipo ON public.amostra_analises USING btree (amostra_id, tipo_analise_id);
CREATE INDEX IF NOT EXISTS idx_amostra_analises_codigo_subamostra ON public.amostra_analises USING btree (codigo_subamostra_id);

-- 5. Triggers
-- Drop existing first
DROP TRIGGER IF EXISTS trg_log_delete_amostra_analises ON public.amostra_analises;
DROP TRIGGER IF EXISTS trg_log_insert_amostra_analises ON public.amostra_analises;
DROP TRIGGER IF EXISTS trg_log_update_amostra_analises ON public.amostra_analises;
DROP TRIGGER IF EXISTS update_amostra_analises_updated_at ON public.amostra_analises;

-- Recreate
CREATE TRIGGER trg_log_delete_amostra_analises
    AFTER DELETE ON public.amostra_analises
    FOR EACH ROW
    EXECUTE FUNCTION log_delete_amostra_analises();

CREATE TRIGGER trg_log_insert_amostra_analises
    AFTER INSERT ON public.amostra_analises
    FOR EACH ROW
    EXECUTE FUNCTION log_insert_amostra_analises();

CREATE TRIGGER trg_log_update_amostra_analises
    AFTER UPDATE ON public.amostra_analises
    FOR EACH ROW
    EXECUTE FUNCTION log_update_amostra_analises();

CREATE TRIGGER update_amostra_analises_updated_at
    BEFORE UPDATE ON public.amostra_analises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable RLS and Policies
ALTER TABLE public.amostra_analises ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'amostra_analises' AND policyname = 'Company data access for amostra_analises') THEN
        CREATE POLICY "Company data access for amostra_analises" ON public.amostra_analises
            USING (empresa_id = get_current_user_empresa_id())
            WITH CHECK (empresa_id = get_current_user_empresa_id());
    END IF;
END $$;
