
-- Create function to generate next sample code
CREATE OR REPLACE FUNCTION gerar_proximo_codigo_amostra()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    ultimo_numero INTEGER;
    proximo_codigo TEXT;
BEGIN
    -- Get the highest number from existing sample codes
    SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 4) AS INTEGER)), 2500000)
    INTO ultimo_numero
    FROM amostras
    WHERE codigo ~ '^EST[0-9]+$';
    
    -- Generate next code
    proximo_codigo := 'EST' || (ultimo_numero + 1)::TEXT;
    
    RETURN proximo_codigo;
END;
$$;
