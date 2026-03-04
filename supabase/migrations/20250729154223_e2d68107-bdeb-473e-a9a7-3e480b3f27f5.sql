-- Criar função para gerar códigos por empresa
CREATE OR REPLACE FUNCTION public.gerar_proximo_codigo_amostra_por_empresa(p_empresa_id bigint)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    ultimo_numero INTEGER;
    proximo_codigo TEXT;
    padrao_busca TEXT;
    empresa_id_str TEXT;
BEGIN
    -- Converter empresa_id para string
    empresa_id_str := p_empresa_id::TEXT;
    
    -- Definir padrão de busca: EST{empresa_id}%
    padrao_busca := 'EST' || empresa_id_str || '%';
    
    -- Buscar o maior número da sequência para esta empresa específica
    -- Extrair apenas a parte numérica após EST{empresa_id}
    SELECT COALESCE(MAX(
        CASE 
            WHEN LENGTH(codigo) > LENGTH('EST' || empresa_id_str) 
            AND codigo ~ ('^EST' || empresa_id_str || '[0-9]+$')
            THEN CAST(SUBSTRING(codigo FROM LENGTH('EST' || empresa_id_str) + 1) AS INTEGER)
            ELSE NULL
        END
    ), 2499999) -- Começar com 2499999 para que o próximo seja 2500000 + 1 = 2500001
    INTO ultimo_numero
    FROM amostras
    WHERE codigo LIKE padrao_busca
    AND empresa_id = p_empresa_id;
    
    -- Gerar próximo código no formato EST{empresa_id}{sequencial}
    proximo_codigo := 'EST' || empresa_id_str || LPAD((ultimo_numero + 1)::TEXT, 7, '0');
    
    RETURN proximo_codigo;
END;
$function$;

-- Atualizar função principal para usar a nova lógica por empresa
CREATE OR REPLACE FUNCTION public.gerar_proximo_codigo_amostra()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    empresa_id_atual bigint;
    proximo_codigo TEXT;
BEGIN
    -- Obter empresa_id do usuário atual
    SELECT get_current_user_empresa_id() INTO empresa_id_atual;
    
    -- Se não conseguir obter empresa_id, usar fallback com timestamp
    IF empresa_id_atual IS NULL THEN
        proximo_codigo := 'EST' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
        RETURN proximo_codigo;
    END IF;
    
    -- Usar função específica por empresa
    SELECT gerar_proximo_codigo_amostra_por_empresa(empresa_id_atual) INTO proximo_codigo;
    
    RETURN proximo_codigo;
END;
$function$;