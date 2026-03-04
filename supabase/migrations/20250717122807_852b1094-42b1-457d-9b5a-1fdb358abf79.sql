-- Adicionar tipos de análise faltantes com cast correto
INSERT INTO tipos_analise (descricao, detalhamento, ativo, empresa_id) 
SELECT descricao, detalhamento, ativo, empresa_id::bigint FROM (VALUES 
  ('Peso Medio', 'Determinação do peso médio de comprimidos ou cápsulas', true, null),
  ('Desintegração', 'Teste de desintegração conforme farmacopeia', true, null),
  ('Ponto fusão', 'Determinação do ponto de fusão da substância', true, null),
  ('Densidade aparente', 'Medição da densidade aparente de pós', true, null),
  ('Indice de refração', 'Determinação do índice de refração', true, null),
  ('Reconstituição Amostra', 'Teste de reconstituição de produtos liofilizados', true, null),
  ('Rotação Optica', 'Determinação da rotação óptica específica', true, null),
  ('Perda de Peso', 'Determinação da perda por dessecação', true, null),
  ('Umidade', 'Determinação do teor de umidade', true, null),
  ('Residuo por incineração', 'Determinação de cinzas por incineração', true, null),
  ('Granulometria', 'Análise do tamanho de partículas', true, null),
  ('Material particulado', 'Contagem de partículas em suspensão', true, null),
  ('Teor', 'Determinação quantitativa do princípio ativo', true, null),
  ('Uniformidade', 'Teste de uniformidade de conteúdo', true, null),
  ('Impurezas individuais', 'Quantificação de impurezas específicas', true, null),
  ('Impurezas Especificas', 'Análise de impurezas conhecidas', true, null),
  ('Impurezas Totais', 'Somatório de todas das impurezas detectadas', true, null),
  ('Dissolução', 'Teste de dissolução in vitro', true, null),
  ('Contagem Bacterias total', 'Contagem de microrganismos aeróbios totais', true, null),
  ('Contagem Fungos total', 'Contagem de bolores e leveduras', true, null),
  ('Esterilidade Microbiana', 'Teste de esterilidade microbiológica', true, null),
  ('Endotoxina', 'Determinação de endotoxinas bacterianas', true, null)
) AS v(descricao, detalhamento, ativo, empresa_id)
WHERE NOT EXISTS (
  SELECT 1 FROM tipos_analise WHERE tipos_analise.descricao = v.descricao
);