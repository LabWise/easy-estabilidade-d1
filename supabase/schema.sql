-- schema.sql
-- Consolidated schema for public schema generated from supabase/migrations
-- Includes tables, functions, triggers, RLS policies, and views found in migrations
-- Generated on 2025-09-02

BEGIN;

-- Ensure required extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 20250626180939-e42d8299-1dba-4943-aca0-9a78e36bba26.sql
-- Criar tabelas base e RLS iniciais

-- Criar tabela de tipos de estabilidade
CREATE TABLE public.tipos_estabilidade (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  sigla VARCHAR(10) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de equipamentos/câmaras
CREATE TABLE public.equipamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  tipo VARCHAR(50) NOT NULL,
  capacidade INTEGER,
  temperatura_min DECIMAL(5,2),
  temperatura_max DECIMAL(5,2),
  umidade_min DECIMAL(5,2),
  umidade_max DECIMAL(5,2),
  localizacao VARCHAR(200),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de produtos
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  codigo VARCHAR(100) NOT NULL UNIQUE,
  principio_ativo VARCHAR(200),
  concentracao VARCHAR(100),
  forma_farmaceutica VARCHAR(100),
  fabricante VARCHAR(200),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de amostras
CREATE TABLE public.amostras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR(100) NOT NULL UNIQUE,
  produto_id UUID REFERENCES public.produtos(id) NOT NULL,
  tipo_estabilidade_id UUID REFERENCES public.tipos_estabilidade(id) NOT NULL,
  equipamento_id UUID REFERENCES public.equipamentos(id) NOT NULL,
  lote VARCHAR(100) NOT NULL,
  data_fabricacao DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  data_entrada DATE NOT NULL DEFAULT CURRENT_DATE,
  quantidade_inicial INTEGER NOT NULL,
  quantidade_atual INTEGER NOT NULL,
  temperatura DECIMAL(5,2),
  umidade DECIMAL(5,2),
  observacoes TEXT,
  status VARCHAR(50) DEFAULT 'ativo',
  usuario_responsavel VARCHAR(100),
  finalizada BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de cronograma de retiradas
CREATE TABLE public.cronograma_retiradas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amostra_id UUID REFERENCES public.amostras(id) NOT NULL,
  tempo_coleta VARCHAR(20) NOT NULL,
  data_programada DATE NOT NULL,
  data_realizada DATE,
  quantidade_retirada INTEGER,
  realizada BOOLEAN DEFAULT false,
  observacoes TEXT,
  usuario_retirada VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dados iniciais
INSERT INTO public.tipos_estabilidade (nome, sigla, descricao) VALUES
('Longa Duração', 'LD', 'Estudo de estabilidade de longa duração em condições normais'),
('Acelerada', 'AC', 'Estudo de estabilidade acelerada em condições de stress'),
('Acompanhamento', 'AP', 'Estudo de acompanhamento pós-comercialização'),
('Fotoestabilidade', 'FOTO', 'Estudo de fotoestabilidade conforme ICH Q1B');

INSERT INTO public.equipamentos (nome, codigo, tipo, capacidade, temperatura_min, temperatura_max, umidade_min, umidade_max, localizacao) VALUES
('Câmara Climática 001', 'CAM-001', 'Climática', 100, 15.0, 35.0, 40.0, 80.0, 'Laboratório A - Sala 101'),
('Câmara Climática 002', 'CAM-002', 'Climática', 150, 15.0, 35.0, 40.0, 80.0, 'Laboratório A - Sala 102'),
('Câmara de Fotoestabilidade', 'CAM-FOTO', 'Fotoestabilidade', 50, 20.0, 30.0, 45.0, 65.0, 'Laboratório B - Sala 201'),
('Estufa 001', 'EST-001', 'Estufa', 80, 35.0, 45.0, 30.0, 70.0, 'Laboratório A - Sala 103');

-- Habilitar RLS inicial
ALTER TABLE public.tipos_estabilidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amostras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cronograma_retiradas ENABLE ROW LEVEL SECURITY;

-- Políticas iniciais (acesso amplo)
CREATE POLICY "Acesso total tipos_estabilidade" ON public.tipos_estabilidade FOR ALL USING (true);
CREATE POLICY "Acesso total equipamentos" ON public.equipamentos FOR ALL USING (true);
CREATE POLICY "Acesso total produtos" ON public.produtos FOR ALL USING (true);
CREATE POLICY "Acesso total amostras" ON public.amostras FOR ALL USING (true);
CREATE POLICY "Acesso total cronograma_retiradas" ON public.cronograma_retiradas FOR ALL USING (true);

-- 20250627121457-d9df8afa-4fd8-44fe-ab13-b3e5fc8b6435.sql
-- Função inicial gerar_proximo_codigo_amostra

-- Create function to generate next sample code
CREATE OR REPLACE FUNCTION gerar_proximo_codigo_amostra()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    ultimo_numero INTEGER;
    proximo_codigo TEXT;
BEGIN
    -- Get the highest number from existing sample codes
    SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 4) AS INTEGER)), 2500000)
    INTO ultimo_numero
    FROM amostras
    WHERE codigo ~ '^EST[0-9]+$';
    
    -- Generate next code
    proximo_codigo := 'EST' || (ultimo_numero + 1)::TEXT;
    
    RETURN proximo_codigo;
END;
$$;

-- 20250627165053-b811f76f-c784-4275-8c11-3517ec17dec0.sql
-- Adiciona coluna codigo_versao e função gerar_cronograma_com_versoes

-- Adicionar coluna para código versionado na tabela cronograma_retiradas
ALTER TABLE cronograma_retiradas ADD COLUMN codigo_versao VARCHAR;

-- Criar função para gerar códigos versionados automaticamente
CREATE OR REPLACE FUNCTION gerar_cronograma_com_versoes(
  p_amostra_id UUID,
  p_codigo_base VARCHAR,
  p_tipo_sigla VARCHAR,
  p_data_entrada DATE
) RETURNS VOID AS $$
DECLARE
  periodo_record RECORD;
  versao_num INTEGER := 1;
  data_programada DATE;
BEGIN
  -- Definir períodos baseado no tipo de estabilidade
  IF p_tipo_sigla = 'AC' THEN
    -- Acelerada: 3M, 6M
    FOR periodo_record IN 
      VALUES ('3M', 90), ('6M', 180)
    LOOP
      data_programada := p_data_entrada + (periodo_record.column2 * INTERVAL '1 day');
      
      INSERT INTO cronograma_retiradas (
        amostra_id,
        codigo_versao,
        tempo_coleta,
        data_programada,
        realizada
      ) VALUES (
        p_amostra_id,
        p_codigo_base || '.' || versao_num,
        periodo_record.column1,
        data_programada,
        false
      );
      
      versao_num := versao_num + 1;
    END LOOP;
    
  ELSIF p_tipo_sigla = 'LD' THEN
    -- Longa Duração: 3M, 6M, 9M, 12M, 18M, 24M, 36M
    FOR periodo_record IN 
      VALUES ('3M', 90), ('6M', 180), ('9M', 270), ('12M', 360), ('18M', 540), ('24M', 720), ('36M', 1080)
    LOOP
      data_programada := p_data_entrada + (periodo_record.column2 * INTERVAL '1 day');
      
      INSERT INTO cronograma_retiradas (
        amostra_id,
        codigo_versao,
        tempo_coleta,
        data_programada,
        realizada
      ) VALUES (
        p_amostra_id,
        p_codigo_base || '.' || versao_num,
        periodo_record.column1,
        data_programada,
        false
      );
      
      versao_num := versao_num + 1;
    END LOOP;
    
  ELSIF p_tipo_sigla = 'AP' THEN
    -- Acompanhamento: 12M, 24M, 36M
    FOR periodo_record IN 
      VALUES ('12M', 360), ('24M', 720), ('36M', 1080)
    LOOP
      data_programada := p_data_entrada + (periodo_record.column2 * INTERVAL '1 day');
      
      INSERT INTO cronograma_retiradas (
        amostra_id,
        codigo_versao,
        tempo_coleta,
        data_programada,
        realizada
      ) VALUES (
        p_amostra_id,
        p_codigo_base || '.' || versao_num,
        periodo_record.column1,
        data_programada,
        false
      );
      
      versao_num := versao_num + 1;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 20250701122716-898b725c-f538-4f84-8f29-fd78ccd5d491.sql
-- Atualiza gerar_cronograma_com_versoes para usar períodos do banco (JSON)

CREATE OR REPLACE FUNCTION public.gerar_cronograma_com_versoes(
  p_amostra_id uuid, 
  p_codigo_base character varying, 
  p_tipo_sigla character varying, 
  p_data_entrada date
)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  periodo_record RECORD;
  versao_num INTEGER := 1;
  data_programada DATE;
  tipo_estabilidade_record RECORD;
BEGIN
  -- Buscar os períodos configurados para o tipo de estabilidade
  SELECT periodos_retirada INTO tipo_estabilidade_record
  FROM tipos_estabilidade 
  WHERE sigla = p_tipo_sigla AND ativo = true;
  
  -- Verificar se encontrou o tipo e se tem períodos configurados
  IF tipo_estabilidade_record IS NULL OR tipo_estabilidade_record.periodos_retirada IS NULL THEN
    -- Se não encontrou períodos configurados, não gerar cronograma
    RETURN;
  END IF;
  
  -- Iterar pelos períodos configurados no JSON
  FOR periodo_record IN 
    SELECT 
      periodo_data->>'periodo' as periodo,
      (periodo_data->>'dias')::integer as dias
    FROM jsonb_array_elements(tipo_estabilidade_record.periodos_retirada) as periodo_data
    WHERE periodo_data->>'periodo' IS NOT NULL 
      AND periodo_data->>'dias' IS NOT NULL
      AND (periodo_data->>'dias')::integer > 0
  LOOP
    data_programada := p_data_entrada + (periodo_record.dias * INTERVAL '1 day');
    
    INSERT INTO cronograma_retiradas (
      amostra_id,
      codigo_versao,
      tempo_coleta,
      data_programada,
      realizada
    ) VALUES (
      p_amostra_id,
      p_codigo_base || '.' || versao_num,
      periodo_record.periodo,
      data_programada,
      false
    );
    
    versao_num := versao_num + 1;
  END LOOP;
END;
$function$;

-- 20250702144011-85578e16-03fa-4ea4-b013-19f2a47d4cf1.sql
-- Historico de status de amostras

-- Criar tabela para histórico de alterações de status
CREATE TABLE public.historico_status_amostras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amostra_id UUID NOT NULL,
  status_anterior VARCHAR,
  status_novo VARCHAR NOT NULL,
  justificativa TEXT NOT NULL,
  usuario_alteracao VARCHAR NOT NULL,
  data_alteracao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.historico_status_amostras ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso
CREATE POLICY "Acesso total historico_status_amostras" 
ON public.historico_status_amostras 
FOR ALL 
USING (true);

-- Adicionar foreign key para amostras
ALTER TABLE public.historico_status_amostras 
ADD CONSTRAINT fk_historico_amostra 
FOREIGN KEY (amostra_id) REFERENCES public.amostras(id) ON DELETE CASCADE;

-- 20250708135842-f5961518-d318-4d3a-b527-00f6551c501a.sql
-- Retiradas de amostras, status_retirada_configuracoes e função validar_retirada_amostra (v1)

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

-- Índices para melhor performance
CREATE INDEX idx_retiradas_amostras_amostra_id ON public.retiradas_amostras(amostra_id);
CREATE INDEX idx_retiradas_amostras_codigo ON public.retiradas_amostras(codigo_amostra);
CREATE INDEX idx_retiradas_amostras_data ON public.retiradas_amostras(data_retirada);
CREATE INDEX idx_retiradas_amostras_usuario ON public.retiradas_amostras(usuario_retirada);

-- Constraint para evitar duplicatas (removida posteriormente)
CREATE UNIQUE INDEX idx_retiradas_amostras_unique_amostra ON public.retiradas_amostras(amostra_id);

-- Habilitar RLS
ALTER TABLE public.retiradas_amostras ENABLE ROW LEVEL SECURITY;

-- Política acesso amplo
CREATE POLICY "Acesso total retiradas_amostras" 
ON public.retiradas_amostras 
FOR ALL 
USING (true);

-- Trigger updated_at
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

-- Política acesso amplo
CREATE POLICY "Acesso total status_retirada_configuracoes" 
ON public.status_retirada_configuracoes 
FOR ALL 
USING (true);

-- Trigger updated_at
CREATE TRIGGER update_status_retirada_configuracoes_updated_at
BEFORE UPDATE ON public.status_retirada_configuracoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para validar retirada de amostra (versão por código da amostra)
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
  SELECT id, status INTO v_amostra_id, v_amostra_status
  FROM public.amostras 
  WHERE codigo = p_codigo_amostra;
  IF v_amostra_id IS NULL THEN
    RETURN jsonb_build_object('sucesso', false,'erro', 'Amostra não encontrada com o código informado','codigo_erro', 'AMOSTRA_NAO_ENCONTRADA');
  END IF;
  IF EXISTS (SELECT 1 FROM public.retiradas_amostras WHERE amostra_id = v_amostra_id) THEN
    RETURN jsonb_build_object('sucesso', false,'erro', 'Esta amostra já foi retirada anteriormente','codigo_erro', 'AMOSTRA_JA_RETIRADA');
  END IF;
  IF v_amostra_status IN ('cancelado', 'finalizada') THEN
    RETURN jsonb_build_object('sucesso', false,'erro', 'Amostra não pode ser retirada devido ao status atual: ' || v_amostra_status,'codigo_erro', 'STATUS_INVALIDO');
  END IF;
  INSERT INTO public.retiradas_amostras (amostra_id,codigo_amostra,usuario_retirada,status_textual,metodo_identificacao,observacoes,ip_address,user_agent)
  VALUES (v_amostra_id,p_codigo_amostra,p_usuario,p_status_textual,p_metodo,p_observacoes,p_ip_address,p_user_agent)
  RETURNING id INTO v_retirada_id;
  UPDATE public.amostras SET status = 'retirada', updated_at = now() WHERE id = v_amostra_id;
  INSERT INTO public.historico_status_amostras (amostra_id,status_anterior,status_novo,justificativa,usuario_alteracao)
  VALUES (v_amostra_id,v_amostra_status,'retirada','Amostra retirada via módulo de retiradas - Status: ' || p_status_textual,p_usuario);
  RETURN jsonb_build_object('sucesso', true,'retirada_id', v_retirada_id,'amostra_id', v_amostra_id,'mensagem', 'Retirada registrada com sucesso');
END;
$$;

-- 20250709120319-97bd63b4-f0a8-45e4-8283-0866fb70a1d4.sql
-- update_updated_at_column + repetição retirada/status config + validar_retirada_amostra (v2)

-- Criar função para atualizar updated_at (se não existir)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabelas retiradas_amostras e status_retirada_configuracoes (mesma definição da migração anterior)
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
CREATE INDEX idx_retiradas_amostras_amostra_id ON public.retiradas_amostras(amostra_id);
CREATE INDEX idx_retiradas_amostras_codigo ON public.retiradas_amostras(codigo_amostra);
CREATE INDEX idx_retiradas_amostras_data ON public.retiradas_amostras(data_retirada);
CREATE INDEX idx_retiradas_amostras_usuario ON public.retiradas_amostras(usuario_retirada);
CREATE UNIQUE INDEX idx_retiradas_amostras_unique_amostra ON public.retiradas_amostras(amostra_id);
ALTER TABLE public.retiradas_amostras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total retiradas_amostras" ON public.retiradas_amostras FOR ALL USING (true);
CREATE TRIGGER update_retiradas_amostras_updated_at BEFORE UPDATE ON public.retiradas_amostras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.status_retirada_configuracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao VARCHAR NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
INSERT INTO public.status_retirada_configuracoes (descricao, ordem) VALUES
('Intacta', 1),('Com vazamento', 2),('Sem identificação', 3),('Danificada', 4),('Contaminada', 5);
ALTER TABLE public.status_retirada_configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total status_retirada_configuracoes" ON public.status_retirada_configuracoes FOR ALL USING (true);
CREATE TRIGGER update_status_retirada_configuracoes_updated_at BEFORE UPDATE ON public.status_retirada_configuracoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- validar_retirada_amostra (v2) com código de versão
CREATE OR REPLACE FUNCTION public.validar_retirada_amostra(
  p_codigo_versao VARCHAR,
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
  v_cronograma_id UUID;
  v_amostra_id UUID;
  v_amostra_status VARCHAR;
  v_retirada_id UUID;
  v_codigo_base VARCHAR;
BEGIN
  SELECT cr.id, cr.amostra_id, a.status, a.codigo
  INTO v_cronograma_id, v_amostra_id, v_amostra_status, v_codigo_base
  FROM cronograma_retiradas cr
  JOIN amostras a ON a.id = cr.amostra_id
  WHERE cr.codigo_versao = p_codigo_versao;
  IF v_cronograma_id IS NULL THEN
    RETURN jsonb_build_object('sucesso', false,'erro', 'Código de versão não encontrado: ' || p_codigo_versao,'codigo_erro', 'VERSAO_NAO_ENCONTRADA');
  END IF;
  IF EXISTS (SELECT 1 FROM public.retiradas_amostras WHERE codigo_amostra = p_codigo_versao) THEN
    RETURN jsonb_build_object('sucesso', false,'erro', 'Esta versão já foi retirada anteriormente: ' || p_codigo_versao,'codigo_erro', 'VERSAO_JA_RETIRADA');
  END IF;
  IF v_amostra_status IN ('cancelado', 'finalizada') THEN
    RETURN jsonb_build_object('sucesso', false,'erro', 'Amostra não pode ser retirada devido ao status atual: ' || v_amostra_status,'codigo_erro', 'STATUS_INVALIDO');
  END IF;
  INSERT INTO public.retiradas_amostras (amostra_id,codigo_amostra,usuario_retirada,status_textual,metodo_identificacao,observacoes,ip_address,user_agent)
  VALUES (v_amostra_id,p_codigo_versao,p_usuario,p_status_textual,p_metodo,p_observacoes,p_ip_address,p_user_agent)
  RETURNING id INTO v_retirada_id;
  UPDATE public.cronograma_retiradas SET realizada = true, data_realizada = CURRENT_DATE, usuario_retirada = p_usuario, quantidade_retirada = 1, observacoes = COALESCE(observacoes, '') || ' | Retirada: ' || p_status_textual, updated_at = now() WHERE id = v_cronograma_id;
  IF NOT EXISTS (
    SELECT 1 FROM cronograma_retiradas 
    WHERE amostra_id = v_amostra_id 
    AND (realizada IS FALSE OR realizada IS NULL)
  ) THEN
    UPDATE public.amostras SET status = 'retirada', updated_at = now() WHERE id = v_amostra_id;
    INSERT INTO public.historico_status_amostras (amostra_id,status_anterior,status_novo,justificativa,usuario_alteracao)
    VALUES (v_amostra_id,v_amostra_status,'retirada','Todas as versões da amostra foram retiradas - Última versão: ' || p_codigo_versao,p_usuario);
  END IF;
  RETURN jsonb_build_object('sucesso', true,'retirada_id', v_retirada_id,'cronograma_id', v_cronograma_id,'codigo_versao', p_codigo_versao,'codigo_base', v_codigo_base,'mensagem', 'Retirada da versão ' || p_codigo_versao || ' registrada com sucesso');
END;
$$;

-- 20250709121506-282ec796-95fc-40fa-9634-52d4c5267ad4.sql
-- Drop+recreate validar_retirada_amostra (parâmetros)

DROP FUNCTION IF EXISTS public.validar_retirada_amostra(character varying,character varying,character varying,character varying,text,inet,text);
CREATE OR REPLACE FUNCTION public.validar_retirada_amostra(
  p_codigo_versao VARCHAR,
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
  v_cronograma_id UUID;
  v_amostra_id UUID;
  v_amostra_status VARCHAR;
  v_retirada_id UUID;
  v_codigo_base VARCHAR;
BEGIN
  SELECT cr.id, cr.amostra_id, a.status, a.codigo INTO v_cronograma_id, v_amostra_id, v_amostra_status, v_codigo_base FROM cronograma_retiradas cr JOIN amostras a ON a.id = cr.amostra_id WHERE cr.codigo_versao = p_codigo_versao;
  IF v_cronograma_id IS NULL THEN RETURN jsonb_build_object('sucesso', false,'erro', 'Código de versão não encontrado: ' || p_codigo_versao,'codigo_erro', 'VERSAO_NAO_ENCONTRADA'); END IF;
  IF EXISTS (SELECT 1 FROM public.retiradas_amostras WHERE codigo_amostra = p_codigo_versao) THEN RETURN jsonb_build_object('sucesso', false,'erro', 'Esta versão já foi retirada anteriormente: ' || p_codigo_versao,'codigo_erro', 'VERSAO_JA_RETIRADA'); END IF;
  IF v_amostra_status IN ('cancelado', 'finalizada') THEN RETURN jsonb_build_object('sucesso', false,'erro', 'Amostra não pode ser retirada devido ao status atual: ' || v_amostra_status,'codigo_erro', 'STATUS_INVALIDO'); END IF;
  INSERT INTO public.retiradas_amostras (amostra_id,codigo_amostra,usuario_retirada,status_textual,metodo_identificacao,observacoes,ip_address,user_agent) VALUES (v_amostra_id,p_codigo_versao,p_usuario,p_status_textual,p_metodo,p_observacoes,p_ip_address,p_user_agent) RETURNING id INTO v_retirada_id;
  UPDATE public.cronograma_retiradas SET realizada = true, data_realizada = CURRENT_DATE, usuario_retirada = p_usuario, quantidade_retirada = 1, observacoes = COALESCE(observacoes, '') || ' | Retirada: ' || p_status_textual, updated_at = now() WHERE id = v_cronograma_id;
  IF NOT EXISTS (SELECT 1 FROM cronograma_retiradas WHERE amostra_id = v_amostra_id AND (realizada IS FALSE OR realizada IS NULL)) THEN UPDATE public.amostras SET status = 'retirada', updated_at = now() WHERE id = v_amostra_id; INSERT INTO public.historico_status_amostras (amostra_id,status_anterior,status_novo,justificativa,usuario_alteracao) VALUES (v_amostra_id,v_amostra_status,'retirada','Todas as versões da amostra foram retiradas - Última versão: ' || p_codigo_versao,p_usuario); END IF;
  RETURN jsonb_build_object('sucesso', true,'retirada_id', v_retirada_id,'cronograma_id', v_cronograma_id,'codigo_versao', p_codigo_versao,'codigo_base', v_codigo_base,'mensagem', 'Retirada da versão ' || p_codigo_versao || ' registrada com sucesso');
END;
$$;

-- 20250709122915-bd47b6f9-2736-462d-8204-ea7c863be9f8.sql
-- Corrige validação de status (finalizado/retirada)

DROP FUNCTION IF EXISTS public.validar_retirada_amostra(character varying,character varying,character varying,character varying,text,inet,text);
CREATE OR REPLACE FUNCTION public.validar_retirada_amostra(
  p_codigo_versao VARCHAR,
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
  v_cronograma_id UUID;
  v_amostra_id UUID;
  v_amostra_status VARCHAR;
  v_retirada_id UUID;
  v_codigo_base VARCHAR;
BEGIN
  SELECT cr.id, cr.amostra_id, a.status, a.codigo INTO v_cronograma_id, v_amostra_id, v_amostra_status, v_codigo_base FROM cronograma_retiradas cr JOIN amostras a ON a.id = cr.amostra_id WHERE cr.codigo_versao = p_codigo_versao;
  IF v_cronograma_id IS NULL THEN RETURN jsonb_build_object('sucesso', false,'erro', 'Código de versão não encontrado: ' || p_codigo_versao,'codigo_erro', 'VERSAO_NAO_ENCONTRADA'); END IF;
  IF EXISTS (SELECT 1 FROM public.retiradas_amostras WHERE codigo_amostra = p_codigo_versao) THEN RETURN jsonb_build_object('sucesso', false,'erro', 'Esta versão já foi retirada anteriormente: ' || p_codigo_versao,'codigo_erro', 'VERSAO_JA_RETIRADA'); END IF;
  IF v_amostra_status IN ('cancelado', 'finalizado', 'retirada') THEN RETURN jsonb_build_object('sucesso', false,'erro', 'Amostra não pode ser retirada devido ao status atual: ' || v_amostra_status,'codigo_erro', 'STATUS_INVALIDO'); END IF;
  INSERT INTO public.retiradas_amostras (amostra_id,codigo_amostra,usuario_retirada,status_textual,metodo_identificacao,observacoes,ip_address,user_agent) VALUES (v_amostra_id,p_codigo_versao,p_usuario,p_status_textual,p_metodo,p_observacoes,p_ip_address,p_user_agent) RETURNING id INTO v_retirada_id;
  UPDATE public.cronograma_retiradas SET realizada = true, data_realizada = CURRENT_DATE, usuario_retirada = p_usuario, quantidade_retirada = 1, observacoes = COALESCE(observacoes, '') || ' | Retirada: ' || p_status_textual, updated_at = now() WHERE id = v_cronograma_id;
  IF NOT EXISTS (SELECT 1 FROM cronograma_retiradas WHERE amostra_id = v_amostra_id AND (realizada IS FALSE OR realizada IS NULL)) THEN UPDATE public.amostras SET status = 'retirada', updated_at = now() WHERE id = v_amostra_id; INSERT INTO public.historico_status_amostras (amostra_id,status_anterior,status_novo,justificativa,usuario_alteracao) VALUES (v_amostra_id,v_amostra_status,'retirada','Todas as versões da amostra foram retiradas - Última versão: ' || p_codigo_versao,p_usuario); END IF;
  RETURN jsonb_build_object('sucesso', true,'retirada_id', v_retirada_id,'cronograma_id', v_cronograma_id,'codigo_versao', p_codigo_versao,'codigo_base', v_codigo_base,'mensagem', 'Retirada da versão ' || p_codigo_versao || ' registrada com sucesso');
END;
$$;

-- 20250709123441-02b16228-f655-4516-aad0-18bf40fe8ce7.sql
-- Remove índice único e cria validar_retirada_sequencial + integra na função principal (v3)

DROP INDEX IF EXISTS idx_retiradas_amostras_unique_amostra;

CREATE OR REPLACE FUNCTION public.validar_retirada_sequencial(
  p_codigo_versao VARCHAR,
  p_amostra_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_numero_versao INTEGER;
  v_codigo_base VARCHAR;
  v_ultima_versao_retirada INTEGER := 0;
  v_versao_anterior VARCHAR;
BEGIN
  v_codigo_base := SPLIT_PART(p_codigo_versao, '.', 1);
  v_numero_versao := CAST(SPLIT_PART(p_codigo_versao, '.', 2) AS INTEGER);
  SELECT COALESCE(MAX(CAST(SPLIT_PART(codigo_amostra, '.', 2) AS INTEGER)), 0)
  INTO v_ultima_versao_retirada
  FROM retiradas_amostras
  WHERE amostra_id = p_amostra_id;
  IF v_numero_versao != (v_ultima_versao_retirada + 1) THEN
    IF v_ultima_versao_retirada = 0 AND v_numero_versao != 1 THEN
      RETURN jsonb_build_object('valido', false,'erro', 'A primeira versão a ser retirada deve ser ' || v_codigo_base || '.1');
    ELSIF v_ultima_versao_retirada > 0 THEN
      v_versao_anterior := v_codigo_base || '.' || (v_ultima_versao_retirada + 1);
      RETURN jsonb_build_object('valido', false,'erro', 'Deve retirar a versão ' || v_versao_anterior || ' antes desta');
    END IF;
  END IF;
  RETURN jsonb_build_object('valido', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.validar_retirada_amostra(
  p_codigo_versao VARCHAR,
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
  v_cronograma_id UUID;
  v_amostra_id UUID;
  v_amostra_status VARCHAR;
  v_retirada_id UUID;
  v_codigo_base VARCHAR;
  v_validacao_sequencial jsonb;
BEGIN
  SELECT cr.id, cr.amostra_id, a.status, a.codigo INTO v_cronograma_id, v_amostra_id, v_amostra_status, v_codigo_base FROM cronograma_retiradas cr JOIN amostras a ON a.id = cr.amostra_id WHERE cr.codigo_versao = p_codigo_versao;
  IF v_cronograma_id IS NULL THEN RETURN jsonb_build_object('sucesso', false,'erro', 'Código de versão não encontrado: ' || p_codigo_versao,'codigo_erro', 'VERSAO_NAO_ENCONTRADA'); END IF;
  IF EXISTS (SELECT 1 FROM public.retiradas_amostras WHERE codigo_amostra = p_codigo_versao) THEN RETURN jsonb_build_object('sucesso', false,'erro', 'Esta versão já foi retirada anteriormente: ' || p_codigo_versao,'codigo_erro', 'VERSAO_JA_RETIRADA'); END IF;
  SELECT validar_retirada_sequencial(p_codigo_versao, v_amostra_id) INTO v_validacao_sequencial;
  IF (v_validacao_sequencial->>'valido')::boolean = false THEN RETURN jsonb_build_object('sucesso', false,'erro', v_validacao_sequencial->>'erro','codigo_erro', 'SEQUENCIA_INVALIDA'); END IF;
  IF v_amostra_status IN ('cancelado', 'finalizado', 'retirada') THEN RETURN jsonb_build_object('sucesso', false,'erro', 'Amostra não pode ser retirada devido ao status atual: ' || v_amostra_status,'codigo_erro', 'STATUS_INVALIDO'); END IF;
  INSERT INTO public.retiradas_amostras (amostra_id,codigo_amostra,usuario_retirada,status_textual,metodo_identificacao,observacoes,ip_address,user_agent) VALUES (v_amostra_id,p_codigo_versao,p_usuario,p_status_textual,p_metodo,p_observacoes,p_ip_address,p_user_agent) RETURNING id INTO v_retirada_id;
  UPDATE public.cronograma_retiradas SET realizada = true, data_realizada = CURRENT_DATE, usuario_retirada = p_usuario, quantidade_retirada = 1, observacoes = COALESCE(observacoes, '') || ' | Retirada: ' || p_status_textual, updated_at = now() WHERE id = v_cronograma_id;
  IF NOT EXISTS (SELECT 1 FROM cronograma_retiradas WHERE amostra_id = v_amostra_id AND (realizada IS FALSE OR realizada IS NULL)) THEN UPDATE public.amostras SET status = 'retirada', updated_at = now() WHERE id = v_amostra_id; INSERT INTO public.historico_status_amostras (amostra_id,status_anterior,status_novo,justificativa,usuario_alteracao) VALUES (v_amostra_id,v_amostra_status,'retirada','Todas as versões da amostra foram retiradas - Última versão: ' || p_codigo_versao,p_usuario); END IF;
  RETURN jsonb_build_object('sucesso', true,'retirada_id', v_retirada_id,'cronograma_id', v_cronograma_id,'codigo_versao', p_codigo_versao,'codigo_base', v_codigo_base,'mensagem', 'Retirada da versão ' || p_codigo_versao || ' registrada com sucesso');
END;
$$;

-- 20250710191838-18832f85-f78d-41be-a128-7e224352ad1f.sql
-- Corrige gerar_proximo_codigo_amostra com laço de unicidade

CREATE OR REPLACE FUNCTION gerar_proximo_codigo_amostra()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    ultimo_numero INTEGER;
    proximo_codigo TEXT;
    codigo_existe BOOLEAN;
BEGIN
    LOOP
        SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 4) AS INTEGER)), 2500000)
        INTO ultimo_numero
        FROM amostras
        WHERE codigo ~ '^EST[0-9]+$';
        proximo_codigo := 'EST' || (ultimo_numero + 1)::TEXT;
        SELECT EXISTS(SELECT 1 FROM amostras WHERE codigo = proximo_codigo) INTO codigo_existe;
        IF NOT codigo_existe THEN
            RETURN proximo_codigo;
        END IF;
        UPDATE amostras SET codigo = codigo WHERE codigo = proximo_codigo AND id = id;
    END LOOP;
END;
$$;

-- 20250714220700-fix-codigo-generation.sql
-- Ajustes adicionais na geração de código (mantido)

CREATE OR REPLACE FUNCTION gerar_proximo_codigo_amostra()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    ultimo_numero INTEGER;
    proximo_codigo TEXT;
    codigo_existe BOOLEAN;
BEGIN
    LOOP
        SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 4) AS INTEGER)), 2500000)
        INTO ultimo_numero
        FROM amostras
        WHERE codigo ~ '^EST[0-9]+$';
        proximo_codigo := 'EST' || (ultimo_numero + 1)::TEXT;
        SELECT EXISTS(SELECT 1 FROM amostras WHERE codigo = proximo_codigo) INTO codigo_existe;
        IF NOT codigo_existe THEN
            RETURN proximo_codigo;
        END IF;
        UPDATE amostras SET codigo = codigo WHERE codigo = proximo_codigo AND id = id;
    END LOOP;
END;
$$;

-- 20250715200945-97146c4a-6a85-4fc8-9880-f41f7b153fe7.sql
-- Log de autenticação em auth.users

CREATE OR REPLACE FUNCTION public.log_user_authentication()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_usuario_id uuid;
  v_empresa_id bigint;
  v_usuario_nome text;
  v_usuario_email text;
BEGIN
  IF OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at AND NEW.last_sign_in_at IS NOT NULL THEN
    SELECT id, empresa_id, nome, email INTO v_usuario_id, v_empresa_id, v_usuario_nome, v_usuario_email FROM public.usuarios WHERE auth_id = NEW.id;
    IF v_usuario_id IS NOT NULL THEN
      INSERT INTO public.logs_auditoria (empresa_id,usuario_id,acao,tabela,registro_id,dados_antes,dados_depois,ip)
      VALUES (v_empresa_id,v_usuario_id,'login','auth.users',NEW.id::text,NULL,jsonb_build_object('user_id', NEW.id,'email', COALESCE(v_usuario_email, NEW.email),'nome', v_usuario_nome,'last_sign_in_at', NEW.last_sign_in_at,'created_at', NEW.created_at),NULL);
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS on_user_login ON auth.users;
CREATE TRIGGER on_user_login AFTER UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.log_user_authentication();

-- 20250717121016-85d58d85-197f-4954-b504-14476d796d1a.sql
-- Tipos de análise e configurações de análise com RLS

CREATE TABLE public.tipos_analise (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao VARCHAR NOT NULL,
  detalhamento TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  empresa_id BIGINT REFERENCES public.empresas(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE TABLE public.configuracoes_analise (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dias_analise INTEGER NOT NULL DEFAULT 30,
  empresa_id BIGINT REFERENCES public.empresas(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(empresa_id)
);
ALTER TABLE public.tipos_analise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_analise ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company data access for tipos_analise" ON public.tipos_analise FOR ALL USING (empresa_id = get_current_user_empresa_id()) WITH CHECK (empresa_id = get_current_user_empresa_id());
CREATE POLICY "Company data access for configuracoes_analise" ON public.configuracoes_analise FOR ALL USING (empresa_id = get_current_user_empresa_id()) WITH CHECK (empresa_id = get_current_user_empresa_id());
CREATE TRIGGER update_tipos_analise_updated_at BEFORE UPDATE ON public.tipos_analise FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_configuracoes_analise_updated_at BEFORE UPDATE ON public.configuracoes_analise FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Pré-cadastro tipos de análise (globais)
INSERT INTO public.tipos_analise (descricao, detalhamento, empresa_id) VALUES
('Aspecto/coloração', 'Análise visual das características físicas', NULL),
('pH', 'Medição do potencial hidrogeniônico', NULL),
('Viscosidade', 'Medição da resistência ao escoamento', NULL),
('Friabilidade', 'Teste de resistência ao desgaste', NULL),
('Dureza', 'Resistência à penetração ou deformação', NULL),
('Peso Médio', 'Determinação do peso médio das unidades', NULL),
('Desintegração', 'Tempo para desintegração completa', NULL),
('Ponto de fusão', 'Temperatura de mudança de estado', NULL),
('Densidade', 'Relação massa/volume', NULL),
('Densidade aparente', 'Densidade incluindo espaços vazios', NULL),
('Índice de refração', 'Medição do desvio da luz', NULL),
('Reconstituição Amostra', 'Capacidade de reconstituição', NULL),
('Rotação Óptica', 'Desvio do plano de luz polarizada', NULL),
('Perda de Peso', 'Variação de massa por aquecimento', NULL),
('Umidade', 'Conteúdo de água na amostra', NULL),
('Resíduo por incineração', 'Resíduo após combustão completa', NULL),
('Granulometria', 'Distribuição do tamanho de partículas', NULL),
('Material particulado', 'Presença de partículas estranhas', NULL),
('Teor', 'Concentração do princípio ativo', NULL),
('Uniformidade', 'Homogeneidade da distribuição', NULL),
('Impurezas individuais', 'Identificação de impurezas específicas', NULL),
('Impurezas Específicas', 'Impurezas conhecidas e identificadas', NULL),
('Impurezas Totais', 'Soma de todas as impurezas presentes', NULL),
('Dissolução', 'Taxa e extensão de dissolução', NULL),
('Contagem Bactérias total', 'Quantificação microbiológica bacteriana', NULL),
('Contagem Fungos total', 'Quantificação microbiológica fúngica', NULL),
('Esterilidade Microbiana', 'Ausência de microrganismos viáveis', NULL),
('Endotoxina', 'Presença de endotoxinas bacterianas', NULL);

-- 20250717133849-a52a69ea-3289-496e-86e4-0944488d55a0.sql
-- Tabela amostra_analises

CREATE TABLE public.amostra_analises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amostra_id UUID NOT NULL,
  tipo_analise_id UUID NOT NULL,
  empresa_id BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(amostra_id, tipo_analise_id)
);
ALTER TABLE public.amostra_analises 
  ADD CONSTRAINT fk_amostra_analises_amostra FOREIGN KEY (amostra_id) REFERENCES public.amostras(id) ON DELETE CASCADE;
ALTER TABLE public.amostra_analises 
  ADD CONSTRAINT fk_amostra_analises_tipo_analise FOREIGN KEY (tipo_analise_id) REFERENCES public.tipos_analise(id) ON DELETE CASCADE;
ALTER TABLE public.amostra_analises 
  ADD CONSTRAINT fk_amostra_analises_empresa FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.amostra_analises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company data access for amostra_analises" ON public.amostra_analises FOR ALL USING (empresa_id = get_current_user_empresa_id()) WITH CHECK (empresa_id = get_current_user_empresa_id());
CREATE TRIGGER update_amostra_analises_updated_at BEFORE UPDATE ON public.amostra_analises FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 20250717140445-fc7fded6-5419-4c79-aad4-7fa1ebb63452.sql
-- status_analises_amostras + funções de log e triggers

CREATE TABLE public.status_analises_amostras (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    amostra_id UUID NOT NULL,
    tipo_analise_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pendente',
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    resultados TEXT,
    observacoes TEXT,
    usuario_analista VARCHAR(255),
    empresa_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT unique_amostra_analise UNIQUE (amostra_id, tipo_analise_id),
    CONSTRAINT fk_status_analises_amostra FOREIGN KEY (amostra_id) REFERENCES amostras(id) ON DELETE CASCADE,
    CONSTRAINT fk_status_analises_tipo FOREIGN KEY (tipo_analise_id) REFERENCES tipos_analise(id) ON DELETE CASCADE,
    CONSTRAINT fk_status_analises_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);
ALTER TABLE public.status_analises_amostras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company data access for status_analises_amostras" ON public.status_analises_amostras FOR ALL USING (empresa_id = get_current_user_empresa_id()) WITH CHECK (empresa_id = get_current_user_empresa_id());
CREATE TRIGGER update_status_analises_amostras_updated_at BEFORE UPDATE ON public.status_analises_amostras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_status_analises_amostra_id ON public.status_analises_amostras(amostra_id);
CREATE INDEX idx_status_analises_tipo_id ON public.status_analises_amostras(tipo_analise_id);
CREATE INDEX idx_status_analises_status ON public.status_analises_amostras(status);
CREATE INDEX idx_status_analises_empresa ON public.status_analises_amostras(empresa_id);

CREATE OR REPLACE FUNCTION public.log_insert_status_analises_amostras()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_auth_id uuid := auth.uid(); v_usuario_id uuid; v_empresa_id bigint; BEGIN SELECT id, empresa_id INTO v_usuario_id, v_empresa_id FROM usuarios WHERE auth_id = v_auth_id; INSERT INTO logs_auditoria (empresa_id,usuario_id,acao,tabela,registro_id,dados_antes,dados_depois,ip) VALUES (v_empresa_id,v_usuario_id,'insert','status_analises_amostras',NEW.id::text,null,to_jsonb(NEW),null); RETURN NEW; END; $function$;
CREATE OR REPLACE FUNCTION public.log_update_status_analises_amostras()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_auth_id uuid := auth.uid(); v_usuario_id uuid; v_empresa_id bigint; BEGIN SELECT id, empresa_id INTO v_usuario_id, v_empresa_id FROM usuarios WHERE auth_id = v_auth_id; INSERT INTO logs_auditoria (empresa_id,usuario_id,acao,tabela,registro_id,dados_antes,dados_depois,ip) VALUES (v_empresa_id,v_usuario_id,'update','status_analises_amostras',NEW.id::text,to_jsonb(OLD),to_jsonb(NEW),null); RETURN NEW; END; $function$;
CREATE OR REPLACE FUNCTION public.log_delete_status_analises_amostras()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_auth_id uuid := auth.uid(); v_usuario_id uuid; v_empresa_id bigint; BEGIN SELECT id, empresa_id INTO v_usuario_id, v_empresa_id FROM usuarios WHERE auth_id = v_auth_id; INSERT INTO logs_auditoria (empresa_id,usuario_id,acao,tabela,registro_id,dados_antes,dados_depois,ip) VALUES (v_empresa_id,v_usuario_id,'delete','status_analises_amostras',OLD.id::text,to_jsonb(OLD),null,null); RETURN OLD; END; $function$;
CREATE TRIGGER log_insert_status_analises_amostras AFTER INSERT ON public.status_analises_amostras FOR EACH ROW EXECUTE FUNCTION public.log_insert_status_analises_amostras();
CREATE TRIGGER log_update_status_analises_amostras AFTER UPDATE ON public.status_analises_amostras FOR EACH ROW EXECUTE FUNCTION public.log_update_status_analises_amostras();
CREATE TRIGGER log_delete_status_analises_amostras AFTER DELETE ON public.status_analises_amostras FOR EACH ROW EXECUTE FUNCTION public.log_delete_status_analises_amostras();

-- 20250717140634-0b50bd7d-6979-4aa5-9fc2-eada1894ccaa.sql
-- Variante com criação das funções antes da tabela (mantida por idempotência)

CREATE OR REPLACE FUNCTION public.log_insert_status_analises_amostras()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$ DECLARE v_auth_id uuid := auth.uid(); v_usuario_id uuid; v_empresa_id bigint; BEGIN SELECT id, empresa_id INTO v_usuario_id, v_empresa_id FROM usuarios WHERE auth_id = v_auth_id; INSERT INTO logs_auditoria (empresa_id,usuario_id,acao,tabela,registro_id,dados_antes,dados_depois,ip) VALUES (v_empresa_id,v_usuario_id,'insert','status_analises_amostras',NEW.id::text,null,to_jsonb(NEW),null); RETURN NEW; END; $function$;
CREATE OR REPLACE FUNCTION public.log_update_status_analises_amostras()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$ DECLARE v_auth_id uuid := auth.uid(); v_usuario_id uuid; v_empresa_id bigint; BEGIN SELECT id, empresa_id INTO v_usuario_id, v_empresa_id FROM usuarios WHERE auth_id = v_auth_id; INSERT INTO logs_auditoria (empresa_id,usuario_id,acao,tabela,registro_id,dados_antes,dados_depois,ip) VALUES (v_empresa_id,v_usuario_id,'update','status_analises_amostras',NEW.id::text,to_jsonb(OLD),to_jsonb(NEW),null); RETURN NEW; END; $function$;
CREATE OR REPLACE FUNCTION public.log_delete_status_analises_amostras()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$ DECLARE v_auth_id uuid := auth.uid(); v_usuario_id uuid; v_empresa_id bigint; BEGIN SELECT id, empresa_id INTO v_usuario_id, v_empresa_id FROM usuarios WHERE auth_id = v_auth_id; INSERT INTO logs_auditoria (empresa_id,usuario_id,acao,tabela,registro_id,dados_antes,dados_depois,ip) VALUES (v_empresa_id,v_usuario_id,'delete','status_analises_amostras',OLD.id::text,to_jsonb(OLD),null,null); RETURN OLD; END; $function$;

CREATE TABLE public.status_analises_amostras (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    amostra_id UUID NOT NULL,
    tipo_analise_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pendente',
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    resultados TEXT,
    observacoes TEXT,
    usuario_analista VARCHAR(255),
    empresa_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT unique_amostra_analise UNIQUE (amostra_id, tipo_analise_id),
    CONSTRAINT fk_status_analises_amostra FOREIGN KEY (amostra_id) REFERENCES amostras(id) ON DELETE CASCADE,
    CONSTRAINT fk_status_analises_tipo FOREIGN KEY (tipo_analise_id) REFERENCES tipos_analise(id) ON DELETE CASCADE,
    CONSTRAINT fk_status_analises_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);
ALTER TABLE public.status_analises_amostras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company data access for status_analises_amostras" ON public.status_analises_amostras FOR ALL USING (empresa_id = get_current_user_empresa_id()) WITH CHECK (empresa_id = get_current_user_empresa_id());
CREATE TRIGGER update_status_analises_amostras_updated_at BEFORE UPDATE ON public.status_analises_amostras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_status_analises_amostra_id ON public.status_analises_amostras(amostra_id);
CREATE INDEX idx_status_analises_tipo_id ON public.status_analises_amostras(tipo_analise_id);
CREATE INDEX idx_status_analises_status ON public.status_analises_amostras(status);
CREATE INDEX idx_status_analises_empresa ON public.status_analises_amostras(empresa_id);
CREATE TRIGGER log_insert_status_analises_amostras AFTER INSERT ON public.status_analises_amostras FOR EACH ROW EXECUTE FUNCTION public.log_insert_status_analises_amostras();
CREATE TRIGGER log_update_status_analises_amostras AFTER UPDATE ON public.status_analises_amostras FOR EACH ROW EXECUTE FUNCTION public.log_update_status_analises_amostras();
CREATE TRIGGER log_delete_status_analises_amostras AFTER DELETE ON public.status_analises_amostras FOR EACH ROW EXECUTE FUNCTION public.log_delete_status_analises_amostras();

-- 20250717170716-b782665d-b87b-47cc-b67b-300ad879402b.sql
-- Atualiza gerar_cronograma_com_versoes para validar JSON array

CREATE OR REPLACE FUNCTION public.gerar_cronograma_com_versoes(p_amostra_id uuid, p_codigo_base character varying, p_tipo_sigla character varying, p_data_entrada date)
 RETURNS void LANGUAGE plpgsql AS $function$
DECLARE periodo_record RECORD; versao_num INTEGER := 1; data_programada DATE; tipo_estabilidade_record RECORD; periodos_json jsonb; BEGIN SELECT periodos_retirada INTO periodos_json FROM tipos_estabilidade WHERE sigla = p_tipo_sigla AND ativo = true; IF periodos_json IS NULL THEN RETURN; END IF; IF jsonb_typeof(periodos_json) != 'array' OR jsonb_array_length(periodos_json) = 0 THEN RETURN; END IF; FOR periodo_record IN SELECT periodo_data->>'periodo' as periodo,(periodo_data->>'dias')::integer as dias FROM jsonb_array_elements(periodos_json) as periodo_data WHERE periodo_data->>'periodo' IS NOT NULL AND periodo_data->>'dias' IS NOT NULL AND (periodo_data->>'dias')::integer > 0 LOOP data_programada := p_data_entrada + (periodo_record.dias * INTERVAL '1 day'); INSERT INTO cronograma_retiradas (amostra_id,codigo_versao,tempo_coleta,data_programada,realizada) VALUES (p_amostra_id,p_codigo_base || '.' || versao_num,periodo_record.periodo,data_programada,false); versao_num := versao_num + 1; END LOOP; END; $function$;

-- 20250718150835-ed2c4d6a-b1eb-4156-ba82-4a1b1b803f4a.sql
-- status_analises_amostras: add usuario_conclusao + historico_alteracao_analises + logs

ALTER TABLE public.status_analises_amostras ADD COLUMN usuario_conclusao character varying;
CREATE TABLE public.historico_alteracao_analises (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amostra_id uuid NOT NULL,
  tipo_alteracao character varying NOT NULL,
  justificativa text NOT NULL,
  usuario_alteracao character varying NOT NULL,
  data_alteracao timestamp with time zone NOT NULL DEFAULT now(),
  dados_antes jsonb,
  dados_depois jsonb,
  empresa_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.historico_alteracao_analises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company data access for historico_alteracao_analises" ON public.historico_alteracao_analises FOR ALL USING (empresa_id = get_current_user_empresa_id()) WITH CHECK (empresa_id = get_current_user_empresa_id());
CREATE TRIGGER update_historico_alteracao_analises_updated_at BEFORE UPDATE ON public.historico_alteracao_analises FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.log_insert_historico_alteracao_analises() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$ DECLARE v_auth_id uuid := auth.uid(); v_usuario_id uuid; v_empresa_id bigint; BEGIN SELECT id, empresa_id INTO v_usuario_id, v_empresa_id FROM usuarios WHERE auth_id = v_auth_id; INSERT INTO logs_auditoria (empresa_id,usuario_id,acao,tabela,registro_id,dados_antes,dados_depois,ip) VALUES (v_empresa_id,v_usuario_id,'insert','historico_alteracao_analises',NEW.id::text,null,to_jsonb(NEW),null); RETURN NEW; END; $function$;
CREATE TRIGGER log_insert_historico_alteracao_analises_trigger AFTER INSERT ON public.historico_alteracao_analises FOR EACH ROW EXECUTE PROCEDURE public.log_insert_historico_alteracao_analises();

-- 20250721140016-858d90ab-0628-4dcc-ab48-14acf3da4ef5.sql
-- validar_retirada_sequencial com mensagens melhoradas

CREATE OR REPLACE FUNCTION public.validar_retirada_sequencial(p_codigo_versao character varying, p_amostra_id uuid)
 RETURNS jsonb LANGUAGE plpgsql AS $function$
DECLARE v_numero_versao INTEGER; v_codigo_base VARCHAR; v_ultima_versao_retirada INTEGER := 0; v_versao_anterior VARCHAR; v_periodo_tempo VARCHAR; BEGIN v_codigo_base := SPLIT_PART(p_codigo_versao, '.', 1); v_numero_versao := CAST(SPLIT_PART(p_codigo_versao, '.', 2) AS INTEGER); SELECT COALESCE(MAX(CAST(SPLIT_PART(codigo_amostra, '.', 2) AS INTEGER)), 0) INTO v_ultima_versao_retirada FROM retiradas_amostras WHERE amostra_id = p_amostra_id; IF v_numero_versao != (v_ultima_versao_retirada + 1) THEN IF v_ultima_versao_retirada = 0 AND v_numero_versao != 1 THEN SELECT tempo_coleta INTO v_periodo_tempo FROM cronograma_retiradas WHERE amostra_id = p_amostra_id AND codigo_versao = v_codigo_base || '.1' LIMIT 1; RETURN jsonb_build_object('valido', false,'erro', 'Retire primeiro a amostra ' || v_codigo_base || '.1 para estudo de ' || COALESCE(v_periodo_tempo, '1M')); ELSIF v_ultima_versao_retirada > 0 THEN v_versao_anterior := v_codigo_base || '.' || (v_ultima_versao_retirada + 1); SELECT tempo_coleta INTO v_periodo_tempo FROM cronograma_retiradas WHERE amostra_id = p_amostra_id AND codigo_versao = v_versao_anterior LIMIT 1; RETURN jsonb_build_object('valido', false,'erro', 'Retire primeiro a amostra ' || v_versao_anterior || ' para estudo de ' || COALESCE(v_periodo_tempo, 'tempo indefinido')); END IF; END IF; RETURN jsonb_build_object('valido', true); END; $function$;

-- 20250721144233-375b8d19-872e-4ea3-82cb-9c8a55871ba6.sql
-- Atualiza gerar_cronograma_com_versoes para meses vs dias

CREATE OR REPLACE FUNCTION public.gerar_cronograma_com_versoes(
  p_amostra_id uuid, 
  p_codigo_base character varying, 
  p_tipo_sigla character varying, 
  p_data_entrada date
)
RETURNS void LANGUAGE plpgsql AS $function$
DECLARE periodo_record RECORD; versao_num INTEGER := 1; data_programada DATE; tipo_estabilidade_record RECORD; periodos_json jsonb; meses_extraidos INTEGER; BEGIN SELECT periodos_retirada INTO periodos_json FROM tipos_estabilidade WHERE sigla = p_tipo_sigla AND ativo = true; IF periodos_json IS NULL THEN RETURN; END IF; IF jsonb_typeof(periodos_json) != 'array' OR jsonb_array_length(periodos_json) = 0 THEN RETURN; END IF; FOR periodo_record IN SELECT periodo_data->>'periodo' as periodo,(periodo_data->>'dias')::integer as dias FROM jsonb_array_elements(periodos_json) as periodo_data WHERE periodo_data->>'periodo' IS NOT NULL AND periodo_data->>'dias' IS NOT NULL AND (periodo_data->>'dias')::integer > 0 LOOP IF periodo_record.periodo ~ '\d+M' THEN meses_extraidos := CAST(substring(periodo_record.periodo from '\d+') AS INTEGER); data_programada := p_data_entrada + (meses_extraidos * INTERVAL '1 month'); ELSE data_programada := p_data_entrada + (periodo_record.dias * INTERVAL '1 day'); END IF; INSERT INTO cronograma_retiradas (amostra_id,codigo_versao,tempo_coleta,data_programada,realizada) VALUES (p_amostra_id,p_codigo_base || '.' || versao_num,periodo_record.periodo,data_programada,false); versao_num := versao_num + 1; END LOOP; END; $function$;

-- 20250722141725-04f753ff-6c1b-40cd-b858-f4a51fe1654c.sql
-- Ajustes fim-de-mês e função adicionar_versao_extra_com_codigo_unico (v1)

CREATE OR REPLACE FUNCTION public.gerar_cronograma_com_versoes(
  p_amostra_id uuid, 
  p_codigo_base character varying, 
  p_tipo_sigla character varying, 
  p_data_entrada date
)
RETURNS void LANGUAGE plpgsql AS $function$
DECLARE periodo_record RECORD; versao_num INTEGER := 1; data_programada DATE; tipo_estabilidade_record RECORD; periodos_json jsonb; meses_extraidos INTEGER; dia_original INTEGER; mes_destino INTEGER; ano_destino INTEGER; ultimo_dia_mes INTEGER; BEGIN SELECT periodos_retirada INTO periodos_json FROM tipos_estabilidade WHERE sigla = p_tipo_sigla AND ativo = true; IF periodos_json IS NULL THEN RETURN; END IF; IF jsonb_typeof(periodos_json) != 'array' OR jsonb_array_length(periodos_json) = 0 THEN RETURN; END IF; dia_original := EXTRACT(DAY FROM p_data_entrada); FOR periodo_record IN SELECT periodo_data->>'periodo' as periodo,(periodo_data->>'dias')::integer as dias FROM jsonb_array_elements(periodos_json) as periodo_data WHERE periodo_data->>'periodo' IS NOT NULL AND periodo_data->>'dias' IS NOT NULL AND (periodo_data->>'dias')::integer > 0 LOOP IF periodo_record.periodo ~ '\d+M' THEN meses_extraidos := CAST(substring(periodo_record.periodo from '\d+') AS INTEGER); mes_destino := EXTRACT(MONTH FROM p_data_entrada) + meses_extraidos; ano_destino := EXTRACT(YEAR FROM p_data_entrada); WHILE mes_destino > 12 LOOP mes_destino := mes_destino - 12; ano_destino := ano_destino + 1; END LOOP; ultimo_dia_mes := EXTRACT(DAY FROM (DATE(ano_destino || '-' || mes_destino || '-01') + INTERVAL '1 month - 1 day')); IF dia_original > ultimo_dia_mes THEN mes_destino := mes_destino + 1; IF mes_destino > 12 THEN mes_destino := 1; ano_destino := ano_destino + 1; END IF; data_programada := DATE(ano_destino || '-' || mes_destino || '-01'); ELSE data_programada := DATE(ano_destino || '-' || mes_destino || '-' || dia_original); END IF; ELSE data_programada := p_data_entrada + (periodo_record.dias * INTERVAL '1 day'); END IF; INSERT INTO cronograma_retiradas (amostra_id,codigo_versao,tempo_coleta,data_programada,realizada) VALUES (p_amostra_id,p_codigo_base || '.' || versao_num,periodo_record.periodo,data_programada,false); versao_num := versao_num + 1; END LOOP; END; $function$;

CREATE OR REPLACE FUNCTION public.adicionar_versao_extra_com_codigo_unico(
  p_amostra_id uuid,
  p_codigo_base character varying,
  p_data_entrada date
)
RETURNS void LANGUAGE plpgsql AS $function$
DECLARE ultima_versao_num INTEGER; nova_versao_num INTEGER; data_extra DATE; BEGIN SELECT COALESCE(MAX(CAST(SPLIT_PART(codigo_versao, '.', 2) AS INTEGER)), 0) INTO ultima_versao_num FROM cronograma_retiradas WHERE amostra_id = p_amostra_id; nova_versao_num := ultima_versao_num + 1; SELECT data_programada INTO data_extra FROM cronograma_retiradas WHERE amostra_id = p_amostra_id ORDER BY data_programada DESC LIMIT 1; IF data_extra IS NULL THEN data_extra := p_data_entrada + INTERVAL '1 day'; ELSE data_extra := data_extra + INTERVAL '1 day'; END IF; INSERT INTO cronograma_retiradas (amostra_id,codigo_versao,tempo_coleta,data_programada,realizada) VALUES (p_amostra_id,p_codigo_base || '.' || nova_versao_num,'Extra',data_extra,false); END; $function$;

-- 20250722150001-update-cronograma-function.sql
-- Corrige tratamento de "Micro" como 6M

CREATE OR REPLACE FUNCTION public.gerar_cronograma_com_versoes(
  p_amostra_id uuid, 
  p_codigo_base character varying, 
  p_tipo_sigla character varying, 
  p_data_entrada date
)
RETURNS void LANGUAGE plpgsql AS $function$
DECLARE periodo_record RECORD; versao_num INTEGER := 1; data_programada DATE; tipo_estabilidade_record RECORD; periodos_json jsonb; meses_extraidos INTEGER; BEGIN SELECT periodos_retirada INTO periodos_json FROM tipos_estabilidade WHERE sigla = p_tipo_sigla AND ativo = true; IF periodos_json IS NULL THEN RETURN; END IF; IF jsonb_typeof(periodos_json) != 'array' OR jsonb_array_length(periodos_json) = 0 THEN RETURN; END IF; FOR periodo_record IN SELECT periodo_data->>'periodo' as periodo,(periodo_data->>'dias')::integer as dias FROM jsonb_array_elements(periodos_json) as periodo_data WHERE periodo_data->>'periodo' IS NOT NULL AND periodo_data->>'dias' IS NOT NULL AND (periodo_data->>'dias')::integer > 0 LOOP IF periodo_record.periodo = 'Micro' THEN meses_extraidos := 6; data_programada := p_data_entrada + (meses_extraidos * INTERVAL '1 month'); ELSIF periodo_record.periodo ~ '\d+M' THEN meses_extraidos := CAST(substring(periodo_record.periodo from '\d+') AS INTEGER); data_programada := p_data_entrada + (meses_extraidos * INTERVAL '1 month'); ELSE data_programada := p_data_entrada + (periodo_record.dias * INTERVAL '1 day'); END IF; INSERT INTO cronograma_retiradas (amostra_id,codigo_versao,tempo_coleta,data_programada,realizada) VALUES (p_amostra_id,p_codigo_base || '.' || versao_num,periodo_record.periodo,data_programada,false); versao_num := versao_num + 1; END LOOP; END; $function$;

-- 20250723161407-f20b800d-0dea-4f7c-b33f-77a25533b0af.sql
-- Corrige cálculo de meses por 30.44 dias

CREATE OR REPLACE FUNCTION public.gerar_cronograma_com_versoes(
  p_amostra_id uuid, 
  p_codigo_base character varying, 
  p_tipo_sigla character varying, 
  p_data_entrada date
)
RETURNS void LANGUAGE plpgsql AS $function$
DECLARE periodo_record RECORD; versao_num INTEGER := 1; data_programada DATE; tipo_estabilidade_record RECORD; periodos_json jsonb; meses_calculados NUMERIC; BEGIN SELECT periodos_retirada INTO periodos_json FROM tipos_estabilidade WHERE sigla = p_tipo_sigla AND ativo = true; IF periodos_json IS NULL THEN RETURN; END IF; IF jsonb_typeof(periodos_json) != 'array' OR jsonb_array_length(periodos_json) = 0 THEN RETURN; END IF; FOR periodo_record IN SELECT periodo_data->>'periodo' as periodo,(periodo_data->>'dias')::integer as dias FROM jsonb_array_elements(periodos_json) as periodo_data WHERE periodo_data->>'periodo' IS NOT NULL AND periodo_data->>'dias' IS NOT NULL AND (periodo_data->>'dias')::integer > 0 LOOP IF periodo_record.periodo ~ '\d+M' THEN meses_calculados := CAST(substring(periodo_record.periodo from '\d+') AS INTEGER); data_programada := p_data_entrada + (meses_calculados * INTERVAL '1 month'); ELSE meses_calculados := ROUND(periodo_record.dias / 30.44); data_programada := p_data_entrada + (meses_calculados * INTERVAL '1 month'); END IF; INSERT INTO cronograma_retiradas (amostra_id,codigo_versao,tempo_coleta,data_programada,realizada) VALUES (p_amostra_id,p_codigo_base || '.' || versao_num,periodo_record.periodo,data_programada,false); versao_num := versao_num + 1; END LOOP; END; $function$;

-- 20250724160841-7bff37ba-531b-4420-ac8d-a6f941b66a00.sql
-- Reverte política problemática e recria políticas simples para usuarios

DROP POLICY IF EXISTS "Users can read their own data" ON public.usuarios;
DROP POLICY IF EXISTS "Users can update their own data" ON public.usuarios;
CREATE POLICY "Users can read their own data" ON public.usuarios FOR SELECT TO authenticated USING (auth.uid() = auth_id);
CREATE POLICY "Users can update their own data" ON public.usuarios FOR UPDATE TO authenticated USING (auth.uid() = auth_id);

-- 20250728143539-fcb0e771-457e-4a61-acce-873d6cd36e9e.sql
-- Atualiza validar_retirada_sequencial para ignorar versões extras

CREATE OR REPLACE FUNCTION public.validar_retirada_sequencial(p_codigo_versao character varying, p_amostra_id uuid)
 RETURNS jsonb LANGUAGE plpgsql AS $function$
DECLARE v_numero_versao INTEGER; v_codigo_base VARCHAR; v_ultima_versao_retirada INTEGER := 0; v_versao_anterior VARCHAR; v_periodo_tempo VARCHAR; v_tempo_coleta_atual VARCHAR; BEGIN v_codigo_base := SPLIT_PART(p_codigo_versao, '.', 1); v_numero_versao := CAST(SPLIT_PART(p_codigo_versao, '.', 2) AS INTEGER); SELECT tempo_coleta INTO v_tempo_coleta_atual FROM cronograma_retiradas WHERE amostra_id = p_amostra_id AND codigo_versao = p_codigo_versao LIMIT 1; IF v_tempo_coleta_atual = 'Extra' OR v_tempo_coleta_atual = 'extra' THEN RETURN jsonb_build_object('valido', true); END IF; SELECT COALESCE(MAX(CAST(SPLIT_PART(ra.codigo_amostra, '.', 2) AS INTEGER)), 0) INTO v_ultima_versao_retirada FROM retiradas_amostras ra JOIN cronograma_retiradas cr ON cr.codigo_versao = ra.codigo_amostra AND cr.amostra_id = ra.amostra_id WHERE ra.amostra_id = p_amostra_id AND (cr.tempo_coleta != 'Extra' AND cr.tempo_coleta != 'extra'); IF v_numero_versao != (v_ultima_versao_retirada + 1) THEN IF v_ultima_versao_retirada = 0 AND v_numero_versao != 1 THEN SELECT tempo_coleta INTO v_periodo_tempo FROM cronograma_retiradas WHERE amostra_id = p_amostra_id AND codigo_versao = v_codigo_base || '.1' LIMIT 1; RETURN jsonb_build_object('valido', false,'erro', 'Retire primeiro a amostra ' || v_codigo_base || '.1 para estudo de ' || COALESCE(v_periodo_tempo, '1M')); ELSIF v_ultima_versao_retirada > 0 THEN v_versao_anterior := v_codigo_base || '.' || (v_ultima_versao_retirada + 1); SELECT tempo_coleta INTO v_periodo_tempo FROM cronograma_retiradas WHERE amostra_id = p_amostra_id AND codigo_versao = v_versao_anterior LIMIT 1; RETURN jsonb_build_object('valido', false,'erro', 'Retire primeiro a amostra ' || v_versao_anterior || ' para estudo de ' || COALESCE(v_periodo_tempo, 'tempo indefinido')); END IF; END IF; RETURN jsonb_build_object('valido', true); END; $function$;

-- 20250729154223-e2d68107-bdeb-473e-a9a7-3e480b3f27f5.sql
-- Geração de códigos por empresa e função principal usando get_current_user_empresa_id

CREATE OR REPLACE FUNCTION public.gerar_proximo_codigo_amostra_por_empresa(p_empresa_id bigint)
 RETURNS text LANGUAGE plpgsql AS $function$
DECLARE ultimo_numero INTEGER; proximo_codigo TEXT; padrao_busca TEXT; empresa_id_str TEXT; BEGIN empresa_id_str := p_empresa_id::TEXT; padrao_busca := 'EST' || empresa_id_str || '%'; SELECT COALESCE(MAX( CASE WHEN LENGTH(codigo) > LENGTH('EST' || empresa_id_str) AND codigo ~ ('^EST' || empresa_id_str || '[0-9]+$') THEN CAST(SUBSTRING(codigo FROM LENGTH('EST' || empresa_id_str) + 1) AS INTEGER) ELSE NULL END ), 2499999) INTO ultimo_numero FROM amostras WHERE codigo LIKE padrao_busca AND empresa_id = p_empresa_id; proximo_codigo := 'EST' || empresa_id_str || LPAD((ultimo_numero + 1)::TEXT, 7, '0'); RETURN proximo_codigo; END; $function$;

CREATE OR REPLACE FUNCTION public.gerar_proximo_codigo_amostra()
 RETURNS text LANGUAGE plpgsql AS $function$
DECLARE empresa_id_atual bigint; proximo_codigo TEXT; BEGIN SELECT get_current_user_empresa_id() INTO empresa_id_atual; IF empresa_id_atual IS NULL THEN proximo_codigo := 'EST' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT; RETURN proximo_codigo; END IF; SELECT gerar_proximo_codigo_amostra_por_empresa(empresa_id_atual) INTO proximo_codigo; RETURN proximo_codigo; END; $function$;

-- 20250731211050_fff7e9b4-c30a-4a1c-95e5-7bbd6e5d4cff.sql
-- Corrige search_path em funções e mantém definições

CREATE OR REPLACE FUNCTION public.get_user_profile_type()
 RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$ SELECT profile_type FROM public.usuarios WHERE id = auth.uid(); $function$;
CREATE OR REPLACE FUNCTION public.gerar_proximo_codigo_amostra()
 RETURNS text LANGUAGE plpgsql SET search_path TO 'public' AS $function$ DECLARE empresa_id_atual bigint; proximo_codigo TEXT; BEGIN SELECT get_current_user_empresa_id() INTO empresa_id_atual; IF empresa_id_atual IS NULL THEN proximo_codigo := 'EST' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT; RETURN proximo_codigo; END IF; SELECT gerar_proximo_codigo_amostra_por_empresa(empresa_id_atual) INTO proximo_codigo; RETURN proximo_codigo; END; $function$;
CREATE OR REPLACE FUNCTION public.debug_auth_uid() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$ SELECT auth.uid(); $function$;
CREATE OR REPLACE FUNCTION public.validate_user_update() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$ DECLARE admin_empresa_id bigint; admin_profile_type text; BEGIN SELECT empresa_id, profile_type INTO admin_empresa_id, admin_profile_type FROM public.usuarios WHERE id = auth.uid(); IF admin_profile_type IS DISTINCT FROM 'administrador' THEN RAISE EXCEPTION 'Apenas administradores podem atualizar usuários.'; END IF; IF OLD.empresa_id IS DISTINCT FROM admin_empresa_id THEN RAISE EXCEPTION 'Administradores podem atualizar usuários apenas de sua própria empresa.'; END IF; IF NEW.empresa_id IS DISTINCT FROM admin_empresa_id THEN RAISE EXCEPTION 'O ID da empresa do usuário não pode ser alterado para fora da empresa do administrador.'; END IF; IF NEW.profile_type IS DISTINCT FROM OLD.profile_type THEN RAISE EXCEPTION 'O tipo de perfil (profile_type) não pode ser alterado por administradores.'; END IF; RETURN NEW; END; $function$;
CREATE OR REPLACE FUNCTION public.validate_user_insert() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$ DECLARE admin_empresa_id bigint; admin_profile_type text; BEGIN SELECT empresa_id, profile_type INTO admin_empresa_id, admin_profile_type FROM public.usuarios WHERE id = auth.uid(); IF admin_profile_type IS DISTINCT FROM 'administrador' THEN RAISE EXCEPTION 'Apenas administradores podem criar novos usuários.'; END IF; IF NEW.empresa_id IS DISTINCT FROM admin_empresa_id THEN RAISE EXCEPTION 'Administradores podem criar usuários apenas para sua própria empresa.'; END IF; RETURN NEW; END; $function$;
CREATE OR REPLACE FUNCTION public.get_current_user_empresa_id() RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$ SELECT empresa_id FROM public.usuarios WHERE auth_id = auth.uid(); $function$;
CREATE OR REPLACE FUNCTION public.validar_retirada_sequencial(p_codigo_versao character varying, p_amostra_id uuid) RETURNS jsonb LANGUAGE plpgsql SET search_path TO 'public' AS $function$ DECLARE v_numero_versao INTEGER; v_codigo_base VARCHAR; v_ultima_versao_retirada INTEGER := 0; v_versao_anterior VARCHAR; v_periodo_tempo VARCHAR; v_tempo_coleta_atual VARCHAR; BEGIN v_codigo_base := SPLIT_PART(p_codigo_versao, '.', 1); v_numero_versao := CAST(SPLIT_PART(p_codigo_versao, '.', 2) AS INTEGER); SELECT tempo_coleta INTO v_tempo_coleta_atual FROM cronograma_retiradas WHERE amostra_id = p_amostra_id AND codigo_versao = p_codigo_versao LIMIT 1; IF v_tempo_coleta_atual = 'Extra' OR v_tempo_coleta_atual = 'extra' THEN RETURN jsonb_build_object('valido', true); END IF; SELECT COALESCE(MAX(CAST(SPLIT_PART(ra.codigo_amostra, '.', 2) AS INTEGER)), 0) INTO v_ultima_versao_retirada FROM retiradas_amostras ra JOIN cronograma_retiradas cr ON cr.codigo_versao = ra.codigo_amostra AND cr.amostra_id = ra.amostra_id WHERE ra.amostra_id = p_amostra_id AND (cr.tempo_coleta != 'Extra' AND cr.tempo_coleta != 'extra'); IF v_numero_versao != (v_ultima_versao_retirada + 1) THEN IF v_ultima_versao_retirada = 0 AND v_numero_versao != 1 THEN SELECT tempo_coleta INTO v_periodo_tempo FROM cronograma_retiradas WHERE amostra_id = p_amostra_id AND codigo_versao = v_codigo_base || '.1' LIMIT 1; RETURN jsonb_build_object('valido', false,'erro', 'Retire primeiro a amostra ' || v_codigo_base || '.1 para estudo de ' || COALESCE(v_periodo_tempo, '1M')); ELSIF v_ultima_versao_retirada > 0 THEN v_versao_anterior := v_codigo_base || '.' || (v_ultima_versao_retirada + 1); SELECT tempo_coleta INTO v_periodo_tempo FROM cronograma_retiradas WHERE amostra_id = p_amostra_id AND codigo_versao = v_versao_anterior LIMIT 1; RETURN jsonb_build_object('valido', false,'erro', 'Retire primeiro a amostra ' || v_versao_anterior || ' para estudo de ' || COALESCE(v_periodo_tempo, 'tempo indefinido')); END IF; END IF; RETURN jsonb_build_object('valido', true); END; $function$;
CREATE OR REPLACE FUNCTION public.adicionar_versao_extra_com_codigo_unico(p_amostra_id uuid, p_codigo_base character varying, p_data_entrada date) RETURNS void LANGUAGE plpgsql SET search_path TO 'public' AS $function$ DECLARE ultima_versao_num INTEGER; nova_versao_num INTEGER; data_extra DATE; BEGIN SELECT COALESCE(MAX(CAST(SPLIT_PART(codigo_versao, '.', 2) AS INTEGER)), 0) INTO ultima_versao_num FROM cronograma_retiradas WHERE amostra_id = p_amostra_id; nova_versao_num := ultima_versao_num + 1; SELECT data_programada INTO data_extra FROM cronograma_retiradas WHERE amostra_id = p_amostra_id ORDER BY data_programada DESC LIMIT 1; IF data_extra IS NULL THEN data_extra := p_data_entrada + INTERVAL '1 day'; ELSE data_extra := data_extra + INTERVAL '1 day'; END IF; INSERT INTO cronograma_retiradas (amostra_id,codigo_versao,tempo_coleta,data_programada,realizada) VALUES (p_amostra_id,p_codigo_base || '.' || nova_versao_num,'Extra',data_extra,false); END; $function$;
CREATE OR REPLACE FUNCTION public.validar_retirada_amostra(p_codigo_versao character varying, p_usuario character varying, p_status_textual character varying, p_metodo character varying, p_observacoes text DEFAULT NULL::text, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text) RETURNS jsonb LANGUAGE plpgsql SET search_path TO 'public' AS $function$ DECLARE v_cronograma_id UUID; v_amostra_id UUID; v_amostra_status VARCHAR; v_retirada_id UUID; v_codigo_base VARCHAR; v_validacao_sequencial jsonb; BEGIN SELECT cr.id, cr.amostra_id, a.status, a.codigo INTO v_cronograma_id, v_amostra_id, v_amostra_status, v_codigo_base FROM cronograma_retiradas cr JOIN amostras a ON a.id = cr.amostra_id WHERE cr.codigo_versao = p_codigo_versao; IF v_cronograma_id IS NULL THEN RETURN jsonb_build_object('sucesso', false,'erro', 'Código de versão não encontrado: ' || p_codigo_versao,'codigo_erro', 'VERSAO_NAO_ENCONTRADA'); END IF; IF EXISTS (SELECT 1 FROM public.retiradas_amostras WHERE codigo_amostra = p_codigo_versao) THEN RETURN jsonb_build_object('sucesso', false,'erro', 'Esta versão já foi retirada anteriormente: ' || p_codigo_versao,'codigo_erro', 'VERSAO_JA_RETIRADA'); END IF; SELECT validar_retirada_sequencial(p_codigo_versao, v_amostra_id) INTO v_validacao_sequencial; IF (v_validacao_sequencial->>'valido')::boolean = false THEN RETURN jsonb_build_object('sucesso', false,'erro', v_validacao_sequencial->>'erro','codigo_erro', 'SEQUENCIA_INVALIDA'); END IF; IF v_amostra_status IN ('cancelado', 'finalizado', 'retirada') THEN RETURN jsonb_build_object('sucesso', false,'erro', 'Amostra não pode ser retirada devido ao status atual: ' || v_amostra_status,'codigo_erro', 'STATUS_INVALIDO'); END IF; INSERT INTO public.retiradas_amostras (amostra_id,codigo_amostra,usuario_retirada,status_textual,metodo_identificacao,observacoes,ip_address,user_agent) VALUES (v_amostra_id,p_codigo_versao,p_usuario,p_status_textual,p_metodo,p_observacoes,p_ip_address,p_user_agent) RETURNING id INTO v_retirada_id; UPDATE public.cronograma_retiradas SET realizada = true, data_realizada = CURRENT_DATE, usuario_retirada = p_usuario, quantidade_retirada = 1, observacoes = COALESCE(observacoes, '') || ' | Retirada: ' || p_status_textual, updated_at = now() WHERE id = v_cronograma_id; IF NOT EXISTS (SELECT 1 FROM cronograma_retiradas WHERE amostra_id = v_amostra_id AND (realizada IS FALSE OR realizada IS NULL)) THEN UPDATE public.amostras SET status = 'retirada', updated_at = now() WHERE id = v_amostra_id; INSERT INTO public.historico_status_amostras (amostra_id,status_anterior,status_novo,justificativa,usuario_alteracao) VALUES (v_amostra_id,v_amostra_status,'retirada','Todas as versões da amostra foram retiradas - Última versão: ' || p_codigo_versao,p_usuario); END IF; RETURN jsonb_build_object('sucesso', true,'retirada_id', v_retirada_id,'cronograma_id', v_cronograma_id,'codigo_versao', p_codigo_versao,'codigo_base', v_codigo_base,'mensagem', 'Retirada da versão ' || p_codigo_versao || ' registrada com sucesso'); END; $function$;
CREATE OR REPLACE FUNCTION public.gerar_cronograma_com_versoes(p_amostra_id uuid, p_codigo_base character varying, p_tipo_sigla character varying, p_data_entrada date) RETURNS void LANGUAGE plpgsql SET search_path TO 'public' AS $function$ DECLARE periodo_record RECORD; versao_num INTEGER := 1; data_programada DATE; tipo_estabilidade_record RECORD; periodos_json jsonb; meses_calculados NUMERIC; BEGIN SELECT periodos_retirada INTO periodos_json FROM tipos_estabilidade WHERE sigla = p_tipo_sigla AND ativo = true; IF periodos_json IS NULL THEN RETURN; END IF; IF jsonb_typeof(periodos_json) != 'array' OR jsonb_array_length(periodos_json) = 0 THEN RETURN; END IF; FOR periodo_record IN SELECT periodo_data->>'periodo' as periodo,(periodo_data->>'dias')::integer as dias FROM jsonb_array_elements(periodos_json) as periodo_data WHERE periodo_data->>'periodo' IS NOT NULL AND periodo_data->>'dias' IS NOT NULL AND (periodo_data->>'dias')::integer > 0 LOOP IF periodo_record.periodo ~ '\d+M' THEN meses_calculados := CAST(substring(periodo_record.periodo from '\d+') AS INTEGER); data_programada := p_data_entrada + (meses_calculados * INTERVAL '1 month'); ELSE meses_calculados := ROUND(periodo_record.dias / 30.44); data_programada := p_data_entrada + (meses_calculados * INTERVAL '1 month'); END IF; INSERT INTO cronograma_retiradas (amostra_id,codigo_versao,tempo_coleta,data_programada,realizada) VALUES (p_amostra_id,p_codigo_base || '.' || versao_num,periodo_record.periodo,data_programada,false); versao_num := versao_num + 1; END LOOP; END; $function$;

-- 20250801133008_c3f9daf1-51c1-4347-9fef-ff4964108e54.sql
-- Corrige políticas e funções get_user_profile_type/get_current_user_empresa_id, política de profile_type

DROP POLICY IF EXISTS "Usuarios comuns nao podem atualizar perfis (RLS)" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios comuns nao podem atualizar perfis RLS" ON public.usuarios;
CREATE OR REPLACE FUNCTION public.get_user_profile_type() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$ SELECT COALESCE( (SELECT profile_type FROM public.usuarios WHERE auth_id = auth.uid()), 'analista_de_laboratorio'::text ); $function$;
CREATE OR REPLACE FUNCTION public.get_current_user_empresa_id() RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$ SELECT COALESCE( (SELECT empresa_id FROM public.usuarios WHERE auth_id = auth.uid()), 1::bigint ); $function$;
CREATE POLICY "Usuarios nao podem alterar profile_type" ON public.usuarios FOR UPDATE USING (auth.uid() = auth_id AND OLD.profile_type = NEW.profile_type) WITH CHECK (auth.uid() = auth_id AND OLD.profile_type = NEW.profile_type);

-- 20250801133059_9f26a868-6a81-4d64-a624-f74e0f91c4fa.sql
-- Versão corrigida das mesmas definições

DROP POLICY IF EXISTS "Usuarios comuns nao podem atualizar perfis (RLS)" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios comuns nao podem atualizar perfis RLS" ON public.usuarios;
CREATE OR REPLACE FUNCTION public.get_user_profile_type() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$ SELECT COALESCE( (SELECT profile_type::text FROM public.usuarios WHERE auth_id = auth.uid()), 'analista_de_laboratorio' ); $function$;
CREATE OR REPLACE FUNCTION public.get_current_user_empresa_id() RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$ SELECT COALESCE( (SELECT empresa_id FROM public.usuarios WHERE auth_id = auth.uid()), 1::bigint ); $function$;
CREATE POLICY "Usuarios nao podem alterar profile_type" ON public.usuarios FOR UPDATE USING (auth.uid() = auth_id AND OLD.profile_type = NEW.profile_type) WITH CHECK (auth.uid() = auth_id AND OLD.profile_type = NEW.profile_type);

-- 20250805202609_dd02dcf5-0f2a-4101-add4-6b895e0ee2ed.sql
-- Política para unidades

CREATE POLICY "Company data access for unidades" ON public.unidades FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 20250806192715_c288d142-1f1f-4fe5-b64e-5e613b0e215c.sql
-- Tabela amostra_ifas, RLS e triggers de auditoria + ajustes IFA

CREATE TABLE public.amostra_ifas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amostra_id UUID NOT NULL,
  ifa_id BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  empresa_id BIGINT NOT NULL DEFAULT get_current_user_empresa_id()
);
CREATE INDEX idx_amostra_ifas_amostra_id ON public.amostra_ifas(amostra_id);
CREATE INDEX idx_amostra_ifas_ifa_id ON public.amostra_ifas(ifa_id);
CREATE INDEX idx_amostra_ifas_empresa_id ON public.amostra_ifas(empresa_id);
ALTER TABLE public.amostra_ifas ADD CONSTRAINT unique_amostra_ifa UNIQUE (amostra_id, ifa_id);
ALTER TABLE public.amostra_ifas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos usuarios autenticados podem ver amostra_ifas" ON public.amostra_ifas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Todos usuarios autenticados podem criar amostra_ifas" ON public.amostra_ifas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Todos usuarios autenticados podem atualizar amostra_ifas" ON public.amostra_ifas FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Administradores podem deletar amostra_ifas" ON public.amostra_ifas FOR DELETE USING (get_user_profile_type() = 'administrador');
CREATE TRIGGER update_amostra_ifas_updated_at BEFORE UPDATE ON public.amostra_ifas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.log_insert_amostra_ifas() RETURNS TRIGGER AS $$
DECLARE v_auth_id uuid := auth.uid(); v_usuario_id uuid; v_empresa_id bigint; BEGIN SELECT id, empresa_id INTO v_usuario_id, v_empresa_id FROM usuarios WHERE auth_id = v_auth_id; INSERT INTO logs_auditoria (empresa_id,usuario_id,acao,tabela,registro_id,dados_antes,dados_depois,ip) VALUES (v_empresa_id,v_usuario_id,'insert','amostra_ifas',NEW.id::text,null,to_jsonb(NEW),null); RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
CREATE OR REPLACE FUNCTION public.log_update_amostra_ifas() RETURNS TRIGGER AS $$
DECLARE v_auth_id uuid := auth.uid(); v_usuario_id uuid; v_empresa_id bigint; BEGIN SELECT id, empresa_id INTO v_usuario_id, v_empresa_id FROM usuarios WHERE auth_id = v_auth_id; INSERT INTO logs_auditoria (empresa_id,usuario_id,acao,tabela,registro_id,dados_antes,dados_depois,ip) VALUES (v_empresa_id,v_usuario_id,'update','amostra_ifas',NEW.id::text,to_jsonb(OLD),to_jsonb(NEW),null); RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
CREATE OR REPLACE FUNCTION public.log_delete_amostra_ifas() RETURNS TRIGGER AS $$
DECLARE v_auth_id uuid := auth.uid(); v_usuario_id uuid; v_empresa_id bigint; BEGIN SELECT id, empresa_id INTO v_usuario_id, v_empresa_id FROM usuarios WHERE auth_id = v_auth_id; INSERT INTO logs_auditoria (empresa_id,usuario_id,acao,tabela,registro_id,dados_antes,dados_depois,ip) VALUES (v_empresa_id,v_usuario_id,'delete','amostra_ifas',OLD.id::text,to_jsonb(OLD),null,null); RETURN OLD; END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
CREATE TRIGGER log_insert_amostra_ifas_trigger AFTER INSERT ON public.amostra_ifas FOR EACH ROW EXECUTE FUNCTION public.log_insert_amostra_ifas();
CREATE TRIGGER log_update_amostra_ifas_trigger AFTER UPDATE ON public.amostra_ifas FOR EACH ROW EXECUTE FUNCTION public.log_update_amostra_ifas();
CREATE TRIGGER log_delete_amostra_ifas_trigger AFTER DELETE ON public.amostra_ifas FOR EACH ROW EXECUTE FUNCTION public.log_delete_amostra_ifas();

-- Ajustes na tabela IFA
ALTER TABLE public.ifa ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.ifa ALTER COLUMN id TYPE UUID USING gen_random_uuid();
UPDATE public.ifa SET empresa_id = get_current_user_empresa_id() WHERE empresa_id IS NULL;
ALTER TABLE public.ifa ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.ifa ALTER COLUMN empresa_id SET DEFAULT get_current_user_empresa_id();

-- 20250806193259_ab599b3f-20e3-420d-8715-c74159669d99.sql
-- Versão alternativa mantendo id bigint em ifa

CREATE TABLE public.amostra_ifas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amostra_id UUID NOT NULL,
  ifa_id BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  empresa_id BIGINT NOT NULL DEFAULT get_current_user_empresa_id()
);
CREATE INDEX idx_amostra_ifas_amostra_id ON public.amostra_ifas(amostra_id);
CREATE INDEX idx_amostra_ifas_ifa_id ON public.amostra_ifas(ifa_id);
CREATE INDEX idx_amostra_ifas_empresa_id ON public.amostra_ifas(empresa_id);
ALTER TABLE public.amostra_ifas ADD CONSTRAINT unique_amostra_ifa UNIQUE (amostra_id, ifa_id);
ALTER TABLE public.amostra_ifas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos usuarios autenticados podem ver amostra_ifas" ON public.amostra_ifas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Todos usuarios autenticados podem criar amostra_ifas" ON public.amostra_ifas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Todos usuarios autenticados podem atualizar amostra_ifas" ON public.amostra_ifas FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Administradores podem deletar amostra_ifas" ON public.amostra_ifas FOR DELETE USING (get_user_profile_type() = 'administrador');
CREATE TRIGGER update_amostra_ifas_updated_at BEFORE UPDATE ON public.amostra_ifas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.log_insert_amostra_ifas() RETURNS TRIGGER AS $$ DECLARE v_auth_id uuid := auth.uid(); v_usuario_id uuid; v_empresa_id bigint; BEGIN SELECT id, empresa_id INTO v_usuario_id, v_empresa_id FROM usuarios WHERE auth_id = v_auth_id; INSERT INTO logs_auditoria (empresa_id,usuario_id,acao,tabela,registro_id,dados_antes,dados_depois,ip) VALUES (v_empresa_id,v_usuario_id,'insert','amostra_ifas',NEW.id::text,null,to_jsonb(NEW),null); RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
CREATE OR REPLACE FUNCTION public.log_update_amostra_ifas() RETURNS TRIGGER AS $$ DECLARE v_auth_id uuid := auth.uid(); v_usuario_id uuid; v_empresa_id bigint; BEGIN SELECT id, empresa_id INTO v_usuario_id, v_empresa_id FROM usuarios WHERE auth_id = v_auth_id; INSERT INTO logs_auditoria (empresa_id,usuario_id,acao,tabela,registro_id,dados_antes,dados_depois,ip) VALUES (v_empresa_id,v_usuario_id,'update','amostra_ifas',NEW.id::text,to_jsonb(OLD),to_jsonb(NEW),null); RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
CREATE OR REPLACE FUNCTION public.log_delete_amostra_ifas() RETURNS TRIGGER AS $$ DECLARE v_auth_id uuid := auth.uid(); v_usuario_id uuid; v_empresa_id bigint; BEGIN SELECT id, empresa_id INTO v_usuario_id, v_empresa_id FROM usuarios WHERE auth_id = v_auth_id; INSERT INTO logs_auditoria (empresa_id,usuario_id,acao,tabela,registro_id,dados_antes,dados_depois,ip) VALUES (v_empresa_id,v_usuario_id,'delete','amostra_ifas',OLD.id::text,to_jsonb(OLD),null,null); RETURN OLD; END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
CREATE TRIGGER log_insert_amostra_ifas_trigger AFTER INSERT ON public.amostra_ifas FOR EACH ROW EXECUTE FUNCTION public.log_insert_amostra_ifas();
CREATE TRIGGER log_update_amostra_ifas_trigger AFTER UPDATE ON public.amostra_ifas FOR EACH ROW EXECUTE FUNCTION public.log_update_amostra_ifas();
CREATE TRIGGER log_delete_amostra_ifas_trigger AFTER DELETE ON public.amostra_ifas FOR EACH ROW EXECUTE FUNCTION public.log_delete_amostra_ifas();

UPDATE public.ifa SET empresa_id = get_current_user_empresa_id() WHERE empresa_id IS NULL;
ALTER TABLE public.ifa ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.ifa ALTER COLUMN empresa_id SET DEFAULT get_current_user_empresa_id();

-- 20250813195139_90321beb-04ce-4789-a038-63f82bc25f52.sql
-- Views de usuários e políticas de visualização

DROP POLICY IF EXISTS "Todos usuarios autenticados podem ver todos os usuarios" ON public.usuarios;
CREATE OR REPLACE VIEW public.usuarios_publicos AS SELECT id,nome,profile_type,empresa_id,ativo,created_at FROM public.usuarios WHERE ativo = true;
CREATE OR REPLACE VIEW public.usuarios_completos AS SELECT * FROM public.usuarios;
ALTER VIEW public.usuarios_publicos SET (security_barrier = true);
ALTER VIEW public.usuarios_completos SET (security_barrier = true);
CREATE POLICY "Users can view their own complete data" ON public.usuarios FOR SELECT TO authenticated USING (auth.uid() = auth_id);
CREATE POLICY "Common users can view public user data" ON public.usuarios FOR SELECT TO authenticated USING ( get_user_profile_type() IN ('analista_de_estabilidade', 'analista_de_laboratorio') AND ativo = true );
CREATE POLICY "Admins and managers can view all user data" ON public.usuarios FOR SELECT TO authenticated USING ( get_user_profile_type() IN ('administrador', 'gestor') );

-- 20250813200121_f4a23369-1151-4cf7-9f92-54ce72cf55ae.sql
-- RLS para perfis_de_usuario (tabela auxiliar)

ALTER TABLE public.perfis_de_usuario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile data" ON public.perfis_de_usuario FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "Administrators can view all profiles in their company" ON public.perfis_de_usuario FOR SELECT USING ( get_user_profile_type() = 'administrador' AND empresa_id = get_current_user_empresa_id() );
CREATE POLICY "Administrators can update profiles in their company" ON public.perfis_de_usuario FOR UPDATE USING ( get_user_profile_type() = 'administrador' AND empresa_id = get_current_user_empresa_id() ) WITH CHECK ( get_user_profile_type() = 'administrador' AND empresa_id = get_current_user_empresa_id() );
CREATE POLICY "Users can update their own profile" ON public.perfis_de_usuario FOR UPDATE USING (auth.uid() = auth_id) WITH CHECK (auth.uid() = auth_id);
CREATE POLICY "Administrators can insert profiles in their company" ON public.perfis_de_usuario FOR INSERT WITH CHECK ( get_user_profile_type() = 'administrador' AND empresa_id = get_current_user_empresa_id() );
CREATE POLICY "Administrators can delete profiles in their company" ON public.perfis_de_usuario FOR DELETE USING ( get_user_profile_type() = 'administrador' AND empresa_id = get_current_user_empresa_id() AND auth.uid() != auth_id );

COMMIT;
