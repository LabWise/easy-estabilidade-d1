-- Criar tabela para tipos de análise
CREATE TABLE public.tipos_analise (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao VARCHAR NOT NULL,
  detalhamento TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  empresa_id BIGINT REFERENCES public.empresas(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para configurações de análise
CREATE TABLE public.configuracoes_analise (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dias_analise INTEGER NOT NULL DEFAULT 30,
  empresa_id BIGINT REFERENCES public.empresas(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(empresa_id)
);

-- Habilitar RLS
ALTER TABLE public.tipos_analise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_analise ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Company data access for tipos_analise" 
ON public.tipos_analise 
FOR ALL 
USING (empresa_id = get_current_user_empresa_id())
WITH CHECK (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Company data access for configuracoes_analise" 
ON public.configuracoes_analise 
FOR ALL 
USING (empresa_id = get_current_user_empresa_id())
WITH CHECK (empresa_id = get_current_user_empresa_id());

-- Trigger para updated_at
CREATE TRIGGER update_tipos_analise_updated_at
BEFORE UPDATE ON public.tipos_analise
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_configuracoes_analise_updated_at
BEFORE UPDATE ON public.configuracoes_analise
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Pré-cadastrar os tipos de análise (sem empresa_id para serem globais)
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