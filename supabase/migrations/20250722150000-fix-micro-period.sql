
-- Corrigir configuração do período "Micro" para ser mais explícito
-- O período "Micro" deve ser tratado como 6 meses (180 dias) mas com nomenclatura clara

UPDATE public.tipos_estabilidade 
SET periodos_retirada = '[
  {"periodo": "3M", "dias": 90}, 
  {"periodo": "Micro", "dias": 180}
]'::jsonb
WHERE sigla = 'AC';

-- Comentário: O período "Micro" é equivalente a 6 meses (180 dias) para análise microbiológica
-- Mantendo a nomenclatura "Micro" conforme solicitado pelo usuário
