-- Criar tabela para registrar retiradas de amostras
CREATE TABLE public.retiradas_amostras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amostra_id UUID NOT NULL REFERENCES public.amostras(id) ON DELETE CASCADE,
  codigo_amostra VARCHAR NOT NULL,
  usuario_retirada VARCHAR NOT NULL,
  data_retirada TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status_textual VARCHAR NOT NULL,
  metodo_identificacao VARCHAR NOT NULL, -- 'qrcode', 'manual', 'lote'
  observacoes TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_retiradas_amostras_amostra_id ON public.retiradas_amostras(amostra_id);
CREATE INDEX idx_retiradas_amostras_codigo ON public.retiradas_amostras(codigo_amostra);
CREATE INDEX idx_retiradas_amostras_data ON public.retiradas_amostras(data_retirada);
CREATE INDEX idx_retiradas_amostras_usuario ON public.retiradas_amostras(usuario_retirada);

-- Criar constraint para evitar duplicatas (uma amostra só pode ser retirada uma vez)
CREATE UNIQUE INDEX idx_retiradas_amostras_unique_amostra ON public.retiradas_amostras(amostra_id);

-- Habilitar RLS
ALTER TABLE public.retiradas_amostras ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso total (como nas outras tabelas)
CREATE POLICY "Acesso total retiradas_amostras" 
ON public.retiradas_amostras 
FOR ALL 
USING (true);

-- Função para atualizar updated_at automaticamente
CREATE TRIGGER update_retiradas_amostras_updated_at
BEFORE UPDATE ON public.retiradas_amostras
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela para configurações de status textuais
CREATE TABLE public.status_retirada_configuracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao VARCHAR NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir status padrão
INSERT INTO public.status_retirada_configuracoes (descricao, ordem) VALUES
('Intacta', 1),
('Com vazamento', 2),
('Sem identificação', 3),
('Danificada', 4),
('Contaminada', 5);

-- Habilitar RLS para configurações
ALTER TABLE public.status_retirada_configuracoes ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso total
CREATE POLICY "Acesso total status_retirada_configuracoes" 
ON public.status_retirada_configuracoes 
FOR ALL 
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_status_retirada_configuracoes_updated_at
BEFORE UPDATE ON public.status_retirada_configuracoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para validar retirada de amostra
CREATE OR REPLACE FUNCTION public.validar_retirada_amostra(
  p_codigo_amostra VARCHAR,
  p_usuario VARCHAR,
  p_status_textual VARCHAR,
  p_metodo VARCHAR,
  p_observacoes TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_amostra_id UUID;
  v_amostra_status VARCHAR;
  v_retirada_id UUID;
  v_resultado jsonb;
BEGIN
  -- Buscar a amostra pelo código
  SELECT id, status INTO v_amostra_id, v_amostra_status
  FROM public.amostras 
  WHERE codigo = p_codigo_amostra;
  
  -- Verificar se a amostra existe
  IF v_amostra_id IS NULL THEN
    RETURN jsonb_build_object(
      'sucesso', false,
      'erro', 'Amostra não encontrada com o código informado',
      'codigo_erro', 'AMOSTRA_NAO_ENCONTRADA'
    );
  END IF;
  
  -- Verificar se a amostra já foi retirada
  IF EXISTS (SELECT 1 FROM public.retiradas_amostras WHERE amostra_id = v_amostra_id) THEN
    RETURN jsonb_build_object(
      'sucesso', false,
      'erro', 'Esta amostra já foi retirada anteriormente',
      'codigo_erro', 'AMOSTRA_JA_RETIRADA'
    );
  END IF;
  
  -- Verificar se a amostra está em status válido para retirada
  IF v_amostra_status IN ('cancelado', 'finalizada') THEN
    RETURN jsonb_build_object(
      'sucesso', false,
      'erro', 'Amostra não pode ser retirada devido ao status atual: ' || v_amostra_status,
      'codigo_erro', 'STATUS_INVALIDO'
    );
  END IF;
  
  -- Registrar a retirada
  INSERT INTO public.retiradas_amostras (
    amostra_id,
    codigo_amostra,
    usuario_retirada,
    status_textual,
    metodo_identificacao,
    observacoes,
    ip_address,
    user_agent
  ) VALUES (
    v_amostra_id,
    p_codigo_amostra,
    p_usuario,
    p_status_textual,
    p_metodo,
    p_observacoes,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_retirada_id;
  
  -- Atualizar status da amostra para "retirada"
  UPDATE public.amostras 
  SET status = 'retirada', updated_at = now()
  WHERE id = v_amostra_id;
  
  -- Registrar no histórico de status
  INSERT INTO public.historico_status_amostras (
    amostra_id,
    status_anterior,
    status_novo,
    justificativa,
    usuario_alteracao
  ) VALUES (
    v_amostra_id,
    v_amostra_status,
    'retirada',
    'Amostra retirada via módulo de retiradas - Status: ' || p_status_textual,
    p_usuario
  );
  
  RETURN jsonb_build_object(
    'sucesso', true,
    'retirada_id', v_retirada_id,
    'amostra_id', v_amostra_id,
    'mensagem', 'Retirada registrada com sucesso'
  );
END;
$$;