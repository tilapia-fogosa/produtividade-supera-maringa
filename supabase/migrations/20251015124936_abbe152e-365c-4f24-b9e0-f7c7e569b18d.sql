-- Função para calcular estatísticas de tempo no processo de Abrindo Horizontes
CREATE OR REPLACE FUNCTION get_ah_tempo_stats()
RETURNS TABLE(
  tempo_medio_coleta_correcao numeric,
  tempo_medio_coleta_entrega numeric,
  tempo_medio_correcao_entrega numeric,
  total_apostilas_corrigidas bigint,
  total_apostilas_entregues bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH primeira_correcao AS (
    SELECT DISTINCT ON (ah_recolhida_id)
      ah_recolhida_id,
      data_fim_correcao
    FROM produtividade_ah
    WHERE ah_recolhida_id IS NOT NULL 
      AND data_fim_correcao IS NOT NULL
    ORDER BY ah_recolhida_id, data_fim_correcao ASC
  ),
  apostilas_com_correcao AS (
    SELECT 
      ar.id,
      ar.created_at as data_recolhida,
      ar.data_entrega_real,
      pc.data_fim_correcao
    FROM ah_recolhidas ar
    INNER JOIN primeira_correcao pc ON pc.ah_recolhida_id = ar.id
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
    
    -- Total de apostilas corrigidas
    COUNT(*)::bigint as total_apostilas_corrigidas,
    
    -- Total de apostilas entregues
    COUNT(data_entrega_real)::bigint as total_apostilas_entregues
  FROM apostilas_com_correcao;
END;
$$;