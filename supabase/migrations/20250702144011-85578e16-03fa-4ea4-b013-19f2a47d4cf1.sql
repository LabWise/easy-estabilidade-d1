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