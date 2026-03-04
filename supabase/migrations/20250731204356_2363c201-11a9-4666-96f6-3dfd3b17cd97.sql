-- Corrigir a ordem dos períodos no tipo de estabilidade "Longa Duração"
-- Mover o período "Extra" para o final para evitar duplicação de códigos de versão

UPDATE tipos_estabilidade 
SET periodos_retirada = '[
  {"dias": 90, "periodo": "3M"},
  {"dias": 180, "periodo": "6M"},
  {"dias": 270, "periodo": "9M"},
  {"dias": 360, "periodo": "12M"},
  {"dias": 540, "periodo": "18M"},
  {"dias": 720, "periodo": "24M"},
  {"dias": 1080, "periodo": "36M"},
  {"dias": 1080, "periodo": "Micro 36M"},
  {"dias": 0, "periodo": "Extra"}
]'::jsonb
WHERE sigla = 'LD' AND nome = 'Longa Duração';

-- Também corrigir o tipo "Fotoestabilidade" que tem período vazio
UPDATE tipos_estabilidade 
SET periodos_retirada = '[
  {"dias": 30, "periodo": "15D"},
  {"dias": 0, "periodo": "Extra"}
]'::jsonb
WHERE sigla = 'FOTO' AND nome = 'Fotoestabilidade';