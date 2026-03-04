-- Corrigir search_path na função gerar_proximo_codigo_amostra_por_empresa
CREATE OR REPLACE FUNCTION public.gerar_proximo_codigo_amostra_por_empresa(p_empresa_id bigint)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    ultimo_numero INTEGER;
    proximo_codigo TEXT;
    ano_atual TEXT;
    padrao_busca TEXT;
BEGIN
    -- Obter os 2 últimos dígitos do ano atual
    ano_atual := LPAD((EXTRACT(YEAR FROM CURRENT_DATE) % 100)::TEXT, 2, '0');
    
    -- Definir padrão de busca para o ano atual: EST[YY]%
    padrao_busca := 'EST' || ano_atual || '%';
    
    -- Buscar o maior número sequencial de 5 dígitos para o ano atual
    SELECT COALESCE(MAX(
        CASE 
            WHEN LENGTH(codigo) = 10 -- EST + 2 dígitos ano + 5 dígitos sequencial
            AND codigo ~ ('^EST' || ano_atual || '[0-9]{5}$')
            THEN CAST(SUBSTRING(codigo FROM 6) AS INTEGER) -- Extrai os últimos 5 dígitos
            ELSE NULL
        END
    ), 0) -- Se não encontrar nenhum, começar com 0
    INTO ultimo_numero
    FROM amostras
    WHERE codigo LIKE padrao_busca;
    
    -- Gerar próximo código no formato EST[YY][5 dígitos]
    -- Garantir que nunca seja 00000
    proximo_codigo := 'EST' || ano_atual || LPAD((ultimo_numero + 1)::TEXT, 5, '0');
    
    RETURN proximo_codigo;
END;
$function$