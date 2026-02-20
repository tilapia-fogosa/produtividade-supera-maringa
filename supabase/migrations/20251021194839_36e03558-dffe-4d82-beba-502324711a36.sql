-- Adicionar coluna data_recolhida na tabela ah_recolhidas
ALTER TABLE ah_recolhidas
ADD COLUMN data_recolhida DATE;

-- Preencher registros existentes com a data do created_at (truncada)
UPDATE ah_recolhidas
SET data_recolhida = created_at::date;

-- Tornar a coluna NOT NULL após preencher os dados
ALTER TABLE ah_recolhidas
ALTER COLUMN data_recolhida SET NOT NULL;

-- Atualizar função get_ah_tempo_stats para usar data_recolhida
DROP FUNCTION IF EXISTS get_ah_tempo_stats();

CREATE OR REPLACE FUNCTION get_ah_tempo_stats()
RETURNS TABLE (
  tempo_medio_coleta_correcao NUMERIC,
  tempo_medio_coleta_entrega NUMERIC,
  tempo_medio_correcao_entrega NUMERIC,
  tempo_medio_inicio_fim_correcao NUMERIC,
  total_apostilas_corrigidas BIGINT,
  total_apostilas_entregues BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH primeira_correcao_por_apostila AS (
    -- Buscar apenas a PRIMEIRA correção de cada apostila
    SELECT DISTINCT ON (ah_recolhida_id)
      ah_recolhida_id,
      data_fim_correcao,
      created_at as data_correcao
    FROM produtividade_ah
    WHERE ah_recolhida_id IS NOT NULL 
      AND data_fim_correcao IS NOT NULL
    ORDER BY ah_recolhida_id, created_at ASC
  ),
  apostilas_com_dados AS (
    SELECT 
      ar.id,
      ar.data_recolhida,
      ar.data_entrega_real::date as data_entrega,
      ar.data_inicio_correcao,
      pc.data_fim_correcao::date as data_correcao_final
    FROM ah_recolhidas ar
    LEFT JOIN primeira_correcao_por_apostila pc ON pc.ah_recolhida_id = ar.id
  )
  SELECT
    -- Tempo médio de coleta -> correção (em dias) - apenas apostilas corrigidas
    ROUND(
      AVG(
        CASE 
          WHEN data_correcao_final IS NOT NULL 
          THEN (data_correcao_final - data_recolhida)
        END
      )::numeric, 
      1
    ) as tempo_medio_coleta_correcao,
    
    -- Tempo médio de coleta -> entrega (em dias) - apenas apostilas entregues
    ROUND(
      AVG(
        CASE 
          WHEN data_entrega IS NOT NULL 
          THEN (data_entrega - data_recolhida)
        END
      )::numeric, 
      1
    ) as tempo_medio_coleta_entrega,
    
    -- Tempo médio de correção -> entrega (em dias) - apenas apostilas corrigidas E entregues
    ROUND(
      AVG(
        CASE 
          WHEN data_entrega IS NOT NULL AND data_correcao_final IS NOT NULL
          THEN (data_entrega - data_correcao_final)
        END
      )::numeric, 
      1
    ) as tempo_medio_correcao_entrega,
    
    -- Tempo médio de início -> fim correção (em dias) - apenas apostilas com início registrado
    ROUND(
      AVG(
        CASE 
          WHEN data_inicio_correcao IS NOT NULL AND data_correcao_final IS NOT NULL
          THEN EXTRACT(EPOCH FROM (data_correcao_final::timestamp - data_inicio_correcao)) / 86400
        END
      )::numeric, 
      1
    ) as tempo_medio_inicio_fim_correcao,
    
    -- Total de apostilas corrigidas (apostilas únicas que tiveram correção)
    COUNT(CASE WHEN data_correcao_final IS NOT NULL THEN 1 END)::bigint as total_apostilas_corrigidas,
    
    -- Total de apostilas entregues (apostilas únicas entregues)
    COUNT(CASE WHEN data_entrega IS NOT NULL THEN 1 END)::bigint as total_apostilas_entregues
  FROM apostilas_com_dados;
END;
$$;