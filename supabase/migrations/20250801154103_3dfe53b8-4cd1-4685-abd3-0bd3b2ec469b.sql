-- Corrigir avisos de segurança da função RPC
CREATE OR REPLACE FUNCTION public.adicionar_versao_extra_com_codigo_unico(
    p_amostra_id UUID,
    p_codigo_base TEXT,
    p_tipo_sigla TEXT,
    p_data_entrada DATE
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    nova_versao_numero INTEGER;
    codigo_versao_extra TEXT;
    data_extra DATE;
    ultima_data_programada DATE;
BEGIN
    -- Buscar todas as versões existentes para encontrar o maior número
    SELECT COALESCE(MAX(
        CASE 
            WHEN split_part(codigo_versao, '.', array_length(string_to_array(codigo_versao, '.'), 1))::TEXT ~ '^[0-9]+$' 
            THEN split_part(codigo_versao, '.', array_length(string_to_array(codigo_versao, '.'), 1))::INTEGER
            ELSE 0
        END
    ), 0) + 1
    INTO nova_versao_numero
    FROM cronograma_retiradas
    WHERE amostra_id = p_amostra_id;

    -- Gerar o código da nova versão
    codigo_versao_extra := p_codigo_base || '.' || nova_versao_numero::TEXT;

    -- Buscar a data mais recente do cronograma para calcular a data extra
    SELECT data_programada
    INTO ultima_data_programada
    FROM cronograma_retiradas
    WHERE amostra_id = p_amostra_id
    ORDER BY data_programada DESC
    LIMIT 1;

    -- Se não encontrou nenhuma data, usar a data de entrada + 1 dia
    -- Caso contrário, usar a última data + 1 dia (igual à lógica do JavaScript)
    IF ultima_data_programada IS NULL THEN
        data_extra := p_data_entrada + INTERVAL '1 day';
    ELSE
        data_extra := ultima_data_programada + INTERVAL '1 day';
    END IF;

    -- Inserir a nova versão extra
    INSERT INTO cronograma_retiradas (
        amostra_id,
        codigo_versao,
        tempo_coleta,
        data_programada,
        realizada
    ) VALUES (
        p_amostra_id,
        codigo_versao_extra,
        'Extra',
        data_extra,
        false
    );

    RETURN codigo_versao_extra;
END;
$$;