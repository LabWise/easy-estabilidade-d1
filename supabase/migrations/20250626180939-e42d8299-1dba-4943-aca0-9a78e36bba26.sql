
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
  tempo_coleta VARCHAR(20) NOT NULL, -- Ex: T0, 3M, 6M, 12M, 18M, 24M
  data_programada DATE NOT NULL,
  data_realizada DATE,
  quantidade_retirada INTEGER,
  realizada BOOLEAN DEFAULT false,
  observacoes TEXT,
  usuario_retirada VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir dados iniciais para tipos de estabilidade
INSERT INTO public.tipos_estabilidade (nome, sigla, descricao) VALUES
('Longa Duração', 'LD', 'Estudo de estabilidade de longa duração em condições normais'),
('Acelerada', 'AC', 'Estudo de estabilidade acelerada em condições de stress'),
('Acompanhamento', 'AP', 'Estudo de acompanhamento pós-comercialização'),
('Fotoestabilidade', 'FOTO', 'Estudo de fotoestabilidade conforme ICH Q1B');

-- Inserir equipamentos de exemplo
INSERT INTO public.equipamentos (nome, codigo, tipo, capacidade, temperatura_min, temperatura_max, umidade_min, umidade_max, localizacao) VALUES
('Câmara Climática 001', 'CAM-001', 'Climática', 100, 15.0, 35.0, 40.0, 80.0, 'Laboratório A - Sala 101'),
('Câmara Climática 002', 'CAM-002', 'Climática', 150, 15.0, 35.0, 40.0, 80.0, 'Laboratório A - Sala 102'),
('Câmara de Fotoestabilidade', 'CAM-FOTO', 'Fotoestabilidade', 50, 20.0, 30.0, 45.0, 65.0, 'Laboratório B - Sala 201'),
('Estufa 001', 'EST-001', 'Estufa', 80, 35.0, 45.0, 30.0, 70.0, 'Laboratório A - Sala 103');

-- Habilitar RLS (Row Level Security) - por enquanto permitindo acesso total
ALTER TABLE public.tipos_estabilidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amostras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cronograma_retiradas ENABLE ROW LEVEL SECURITY;

-- Criar políticas para permitir acesso completo (pode ser refinado posteriormente)
CREATE POLICY "Acesso total tipos_estabilidade" ON public.tipos_estabilidade FOR ALL USING (true);
CREATE POLICY "Acesso total equipamentos" ON public.equipamentos FOR ALL USING (true);
CREATE POLICY "Acesso total produtos" ON public.produtos FOR ALL USING (true);
CREATE POLICY "Acesso total amostras" ON public.amostras FOR ALL USING (true);
CREATE POLICY "Acesso total cronograma_retiradas" ON public.cronograma_retiradas FOR ALL USING (true);
