
-- Adicionar coluna para armazenar os períodos de retirada como JSON
ALTER TABLE public.tipos_estabilidade 
ADD COLUMN periodos_retirada JSONB DEFAULT '[]'::jsonb;

-- Atualizar os tipos existentes com os períodos padrão baseados na lógica atual
UPDATE public.tipos_estabilidade 
SET periodos_retirada = 
  CASE 
    WHEN sigla = 'AC' THEN '[{"periodo": "3M", "dias": 90}, {"periodo": "6M", "dias": 180}]'::jsonb
    WHEN sigla = 'LD' THEN '[{"periodo": "3M", "dias": 90}, {"periodo": "6M", "dias": 180}, {"periodo": "9M", "dias": 270}, {"periodo": "12M", "dias": 360}, {"periodo": "18M", "dias": 540}, {"periodo": "24M", "dias": 720}, {"periodo": "36M", "dias": 1080}]'::jsonb
    WHEN sigla = 'AP' THEN '[{"periodo": "12M", "dias": 360}, {"periodo": "24M", "dias": 720}, {"periodo": "36M", "dias": 1080}]'::jsonb
    ELSE '[]'::jsonb
  END;

-- Comentário para explicar a estrutura dos dados:
-- periodos_retirada armazena um array JSON com objetos contendo:
-- - periodo: string (ex: "3M", "6M", "12M")
-- - dias: number (quantidade de dias para calcular a data)
