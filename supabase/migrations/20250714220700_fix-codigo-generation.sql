
-- Fix the function to generate unique sample codes
CREATE OR REPLACE FUNCTION gerar_proximo_codigo_amostra()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    ultimo_numero INTEGER;
    proximo_codigo TEXT;
    codigo_existe BOOLEAN;
BEGIN
    -- Loop até encontrar um código único
    LOOP
        -- Get the highest number from existing sample codes
        SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 4) AS INTEGER)), 2500000)
        INTO ultimo_numero
        FROM amostras
        WHERE codigo ~ '^EST[0-9]+$';
        
        -- Generate next code
        proximo_codigo := 'EST' || (ultimo_numero + 1)::TEXT;
        
        -- Verifica se o código já existe
        SELECT EXISTS(
            SELECT 1 FROM amostras WHERE codigo = proximo_codigo
        ) INTO codigo_existe;
        
        -- Se não existe, retorna o código
        IF NOT codigo_existe THEN
            RETURN proximo_codigo;
        END IF;
        
        -- Se existe, incrementa mais um e tenta novamente
        -- Isso evita problemas de concorrência
        UPDATE amostras SET codigo = codigo WHERE codigo = proximo_codigo AND id = id;
    END LOOP;
END;
$$;
