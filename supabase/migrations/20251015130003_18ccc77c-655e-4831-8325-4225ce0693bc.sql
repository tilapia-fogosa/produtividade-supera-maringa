-- Atualizar função get_ah_tempo_stats para considerar TODAS as correções
DROP FUNCTION IF EXISTS get_ah_tempo_stats();

CREATE OR REPLACE FUNCTION get_ah_tempo_stats()
RETURNS TABLE (
  tempo_medio_coleta_correcao NUMERIC,
  tempo_medio_coleta_entrega NUMERIC,
  tempo_medio_correcao_entrega NUMERIC,
  total_apostilas_corrigidas BIGINT,
  total_apostilas_entregues BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH todas_correcoes AS (
    -- Buscar TODAS as correções (não apenas a primeira)
    SELECT 
      ah_recolhida_id,
      data_fim_correcao
    FROM produtividade_ah
    WHERE ah_recolhida_id IS NOT NULL 
      AND data_fim_correcao IS NOT NULL
  ),
  apostilas_com_correcao AS (
    SELECT 
      ar.id,
      ar.created_at as data_recolhida,
      ar.data_entrega_real,
      tc.data_fim_correcao
    FROM ah_recolhidas ar
    INNER JOIN todas_correcoes tc ON tc.ah_recolhida_id = ar.id
  )
  SELECT
    -- Tempo médio de coleta -> correção (em dias)
    ROUND(
      AVG(EXTRACT(EPOCH FROM (data_fim_correcao - data_recolhida)) / 86400)::numeric, 
      1
    ) as tempo_medio_coleta_correcao,
    
    -- Tempo médio de coleta -> entrega (em dias)
    ROUND(
      AVG(
        CASE 
          WHEN data_entrega_real IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (data_entrega_real - data_recolhida)) / 86400
        END
      )::numeric, 
      1
    ) as tempo_medio_coleta_entrega,
    
    -- Tempo médio de correção -> entrega (em dias)
    ROUND(
      AVG(
        CASE 
          WHEN data_entrega_real IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (data_entrega_real - data_fim_correcao)) / 86400
        END
      )::numeric, 
      1
    ) as tempo_medio_correcao_entrega,
    
    -- Total de correções realizadas (considerando todas, não apenas apostilas únicas)
    COUNT(*)::bigint as total_apostilas_corrigidas,
    
    -- Total de apostilas entregues (pode ter apostilas corrigidas múltiplas vezes antes da entrega)
    COUNT(DISTINCT CASE WHEN data_entrega_real IS NOT NULL THEN id END)::bigint as total_apostilas_entregues
  FROM apostilas_com_correcao;
END;
$$;