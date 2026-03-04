-- Índices compostos para otimizar performance de consultas
-- Índice para busca de amostras por código, produto e lote
CREATE INDEX IF NOT EXISTS idx_amostras_search 
ON amostras(codigo, nome_produto, lote, empresa_id);

-- Índice para cronograma por amostra e status de realização
CREATE INDEX IF NOT EXISTS idx_cronograma_amostra_realizada 
ON cronograma_retiradas(amostra_id, realizada, empresa_id);

-- Índice para busca de amostras por tipo de estabilidade
CREATE INDEX IF NOT EXISTS idx_amostras_tipo_estabilidade 
ON amostras(tipo_estabilidade_id, empresa_id);

-- Índice para busca de amostras por status
CREATE INDEX IF NOT EXISTS idx_amostras_status 
ON amostras(status, empresa_id);

-- Índice para cronograma por data programada (usado em próximas retiradas)
CREATE INDEX IF NOT EXISTS idx_cronograma_data_programada 
ON cronograma_retiradas(data_programada, realizada, empresa_id);

-- Comentários sobre os índices para documentação
COMMENT ON INDEX idx_amostras_search IS 'Otimiza busca de amostras por código, produto e lote';
COMMENT ON INDEX idx_cronograma_amostra_realizada IS 'Otimiza contagem de versões realizadas por amostra';
COMMENT ON INDEX idx_amostras_tipo_estabilidade IS 'Otimiza filtro por tipo de estabilidade';
COMMENT ON INDEX idx_amostras_status IS 'Otimiza filtro por status';
COMMENT ON INDEX idx_cronograma_data_programada IS 'Otimiza consultas de próximas retiradas';