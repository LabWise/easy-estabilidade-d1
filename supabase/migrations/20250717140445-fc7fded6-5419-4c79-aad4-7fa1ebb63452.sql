-- Criar tabela para controlar o status das análises de cada amostra
CREATE TABLE public.status_analises_amostras (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    amostra_id UUID NOT NULL,
    tipo_analise_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pendente', -- pendente, em_andamento, concluida
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    resultados TEXT,
    observacoes TEXT,
    usuario_analista VARCHAR(255),
    empresa_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unique_amostra_analise UNIQUE (amostra_id, tipo_analise_id),
    CONSTRAINT fk_status_analises_amostra FOREIGN KEY (amostra_id) REFERENCES amostras(id) ON DELETE CASCADE,
    CONSTRAINT fk_status_analises_tipo FOREIGN KEY (tipo_analise_id) REFERENCES tipos_analise(id) ON DELETE CASCADE,
    CONSTRAINT fk_status_analises_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

-- Habilitar RLS
ALTER TABLE public.status_analises_amostras ENABLE ROW LEVEL SECURITY;

-- Política de acesso por empresa
CREATE POLICY "Company data access for status_analises_amostras" 
ON public.status_analises_amostras 
FOR ALL 
USING (empresa_id = get_current_user_empresa_id())
WITH CHECK (empresa_id = get_current_user_empresa_id());

-- Trigger para updated_at
CREATE TRIGGER update_status_analises_amostras_updated_at
    BEFORE UPDATE ON public.status_analises_amostras
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_status_analises_amostra_id ON public.status_analises_amostras(amostra_id);
CREATE INDEX idx_status_analises_tipo_id ON public.status_analises_amostras(tipo_analise_id);
CREATE INDEX idx_status_analises_status ON public.status_analises_amostras(status);
CREATE INDEX idx_status_analises_empresa ON public.status_analises_amostras(empresa_id);

-- Trigger de auditoria para insert
CREATE TRIGGER log_insert_status_analises_amostras
    AFTER INSERT ON public.status_analises_amostras
    FOR EACH ROW
    EXECUTE FUNCTION public.log_insert_status_analises_amostras();

-- Trigger de auditoria para update
CREATE TRIGGER log_update_status_analises_amostras
    AFTER UPDATE ON public.status_analises_amostras
    FOR EACH ROW
    EXECUTE FUNCTION public.log_update_status_analises_amostras();

-- Trigger de auditoria para delete
CREATE TRIGGER log_delete_status_analises_amostras
    AFTER DELETE ON public.status_analises_amostras
    FOR EACH ROW
    EXECUTE FUNCTION public.log_delete_status_analises_amostras();

-- Função de auditoria para insert
CREATE OR REPLACE FUNCTION public.log_insert_status_analises_amostras()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    'status_analises_amostras',
    NEW.id::text,
    null,
    to_jsonb(NEW),
    null
  );

  RETURN NEW;
END;
$function$;

-- Função de auditoria para update
CREATE OR REPLACE FUNCTION public.log_update_status_analises_amostras()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    'status_analises_amostras',
    NEW.id::text,
    to_jsonb(OLD),
    to_jsonb(NEW),
    null
  );

  RETURN NEW;
END;
$function$;

-- Função de auditoria para delete
CREATE OR REPLACE FUNCTION public.log_delete_status_analises_amostras()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    'status_analises_amostras',
    OLD.id::text,
    to_jsonb(OLD),
    null,
    null
  );

  RETURN OLD;
END;
$function$;