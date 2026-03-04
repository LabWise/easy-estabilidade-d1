
-- Limpar todas as tabelas na ordem correta para respeitar as foreign keys
DELETE FROM cronograma_retiradas;
DELETE FROM amostras;

-- Resetar a sequência do código das amostras para começar do EST2500001
-- (isso será feito através da função que já existe no sistema)
