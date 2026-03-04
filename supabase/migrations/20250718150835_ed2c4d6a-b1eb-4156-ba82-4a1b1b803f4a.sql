
-- Adicionar campo usuario_conclusao na tabela status_analises_amostras
ALTER TABLE public.status_analises_amostras 
ADD COLUMN usuario_conclusao character varying;

-- Criar tabela para histórico de alterações nas análises
CREATE TABLE public.historico_alteracao_analises (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amostra_id uuid NOT NULL,
  tipo_alteracao character varying NOT NULL, -- 'adicao', 'edicao', 'remocao'
  justificativa text NOT NULL,
  usuario_alteracao character varying NOT NULL,
  data_alteracao timestamp with time zone NOT NULL DEFAULT now(),
  dados_antes jsonb,
  dados_depois jsonb,
  empresa_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.historico_alteracao_analises ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para a nova tabela
CREATE POLICY "Company data access for historico_alteracao_analises" 
  ON public.historico_alteracao_analises 
  FOR ALL 
  USING (empresa_id = get_current_user_empresa_id())
  WITH CHECK (empresa_id = get_current_user_empresa_id());

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_historico_alteracao_analises_updated_at
  BEFORE UPDATE ON public.historico_alteracao_analises
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Criar função de log para a nova tabela
CREATE OR REPLACE FUNCTION public.log_insert_historico_alteracao_analises()
RETURNS trigger
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
    'historico_alteracao_analises',
    NEW.id::text,
    null,
    to_jsonb(NEW),
    null
  );

  RETURN NEW;
END;
$function$;

-- Criar trigger de log para inserções
CREATE TRIGGER log_insert_historico_alteracao_analises_trigger
  AFTER INSERT ON public.historico_alteracao_analises
  FOR EACH ROW EXECUTE PROCEDURE public.log_insert_historico_alteracao_analises();
