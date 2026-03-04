-- Criar tabela para armazenar as análises selecionadas por amostra
CREATE TABLE public.amostra_analises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amostra_id UUID NOT NULL,
  tipo_analise_id UUID NOT NULL,
  empresa_id BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(amostra_id, tipo_analise_id)
);

-- Adicionar foreign keys
ALTER TABLE public.amostra_analises 
ADD CONSTRAINT fk_amostra_analises_amostra 
FOREIGN KEY (amostra_id) REFERENCES public.amostras(id) ON DELETE CASCADE;

ALTER TABLE public.amostra_analises 
ADD CONSTRAINT fk_amostra_analises_tipo_analise 
FOREIGN KEY (tipo_analise_id) REFERENCES public.tipos_analise(id) ON DELETE CASCADE;

ALTER TABLE public.amostra_analises 
ADD CONSTRAINT fk_amostra_analises_empresa 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

-- Habilitar RLS
ALTER TABLE public.amostra_analises ENABLE ROW LEVEL SECURITY;

-- Criar política RLS
CREATE POLICY "Company data access for amostra_analises" 
ON public.amostra_analises 
FOR ALL 
USING (empresa_id = get_current_user_empresa_id())
WITH CHECK (empresa_id = get_current_user_empresa_id());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_amostra_analises_updated_at
BEFORE UPDATE ON public.amostra_analises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();