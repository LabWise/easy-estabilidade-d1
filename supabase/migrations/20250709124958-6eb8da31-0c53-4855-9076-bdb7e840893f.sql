
-- Limpar toda a base de dados para testes
DELETE FROM public.retiradas_amostras;
DELETE FROM public.cronograma_retiradas;
DELETE FROM public.historico_status_amostras;
DELETE FROM public.amostras;

-- Resetar a sequência de códigos se necessário
-- (a função gerar_proximo_codigo_amostra já lida com isso automaticamente)
