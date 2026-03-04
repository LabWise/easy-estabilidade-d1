-- Criar tabela de relacionamento entre amostras e IFAs
CREATE TABLE public.amostra_ifas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amostra_id UUID NOT NULL,
  ifa_id BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  empresa_id BIGINT NOT NULL DEFAULT get_current_user_empresa_id()
);

-- Índices para performance
CREATE INDEX idx_amostra_ifas_amostra_id ON public.amostra_ifas(amostra_id);
CREATE INDEX idx_amostra_ifas_ifa_id ON public.amostra_ifas(ifa_id);
CREATE INDEX idx_amostra_ifas_empresa_id ON public.amostra_ifas(empresa_id);

-- Constraint única para evitar duplicação de relacionamento
ALTER TABLE public.amostra_ifas ADD CONSTRAINT unique_amostra_ifa 
UNIQUE (amostra_id, ifa_id);

-- Enable Row Level Security
ALTER TABLE public.amostra_ifas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Todos usuarios autenticados podem ver amostra_ifas" 
ON public.amostra_ifas 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Todos usuarios autenticados podem criar amostra_ifas" 
ON public.amostra_ifas 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Todos usuarios autenticados podem atualizar amostra_ifas" 
ON public.amostra_ifas 
FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Administradores podem deletar amostra_ifas" 
ON public.amostra_ifas 
FOR DELETE 
USING (get_user_profile_type() = 'administrador');

-- Trigger para updated_at
CREATE TRIGGER update_amostra_ifas_updated_at
BEFORE UPDATE ON public.amostra_ifas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers de auditoria
CREATE OR REPLACE FUNCTION public.log_insert_amostra_ifas()
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
    'amostra_ifas',
    NEW.id::text,
    null,
    to_jsonb(NEW),
    null
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION public.log_update_amostra_ifas()
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
    'amostra_ifas',
    NEW.id::text,
    to_jsonb(OLD),
    to_jsonb(NEW),
    null
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION public.log_delete_amostra_ifas()
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
    'amostra_ifas',
    OLD.id::text,
    to_jsonb(OLD),
    null,
    null
  );

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Criar triggers de auditoria
CREATE TRIGGER log_insert_amostra_ifas_trigger
AFTER INSERT ON public.amostra_ifas
FOR EACH ROW
EXECUTE FUNCTION public.log_insert_amostra_ifas();

CREATE TRIGGER log_update_amostra_ifas_trigger
AFTER UPDATE ON public.amostra_ifas
FOR EACH ROW
EXECUTE FUNCTION public.log_update_amostra_ifas();

CREATE TRIGGER log_delete_amostra_ifas_trigger
AFTER DELETE ON public.amostra_ifas
FOR EACH ROW
EXECUTE FUNCTION public.log_delete_amostra_ifas();

-- Corrigir o ID da tabela IFA para UUID (atualmente é bigint)
ALTER TABLE public.ifa ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.ifa ALTER COLUMN id TYPE UUID USING gen_random_uuid();

-- Definir empresa_id como obrigatório na tabela IFA
UPDATE public.ifa SET empresa_id = get_current_user_empresa_id() WHERE empresa_id IS NULL;
ALTER TABLE public.ifa ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.ifa ALTER COLUMN empresa_id SET DEFAULT get_current_user_empresa_id();