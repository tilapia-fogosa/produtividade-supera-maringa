DROP FUNCTION IF EXISTS get_ah_tempo_stats();

CREATE OR REPLACE FUNCTION get_ah_tempo_stats(p_unit_id uuid DEFAULT NULL)
 RETURNS TABLE(tempo_medio_coleta_correcao numeric, tempo_medio_coleta_entrega numeric, tempo_medio_correcao_entrega numeric, tempo_medio_inicio_fim_correcao numeric, total_apostilas_corrigidas bigint, total_apostilas_entregues bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH primeira_correcao_por_apostila AS (
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
    WHERE (p_unit_id IS NULL OR EXISTS (
      SELECT 1 FROM alunos a WHERE a.id = ar.pessoa_id AND a.unit_id = p_unit_id
      UNION ALL
      SELECT 1 FROM funcionarios f WHERE f.id = ar.pessoa_id AND f.unit_id = p_unit_id
    ))
  )
  SELECT
    ROUND(
      AVG(
        CASE 
          WHEN data_correcao_final IS NOT NULL 
          THEN (data_correcao_final - data_recolhida)
        END
      )::numeric, 
      1
    ) as tempo_medio_coleta_correcao,
    ROUND(
      AVG(
        CASE 
          WHEN data_entrega IS NOT NULL 
          THEN (data_entrega - data_recolhida)
        END
      )::numeric, 
      1
    ) as tempo_medio_coleta_entrega,
    ROUND(
      AVG(
        CASE 
          WHEN data_entrega IS NOT NULL AND data_correcao_final IS NOT NULL
          THEN (data_entrega - data_correcao_final)
        END
      )::numeric, 
      1
    ) as tempo_medio_correcao_entrega,
    ROUND(
      AVG(
        CASE 
          WHEN data_inicio_correcao IS NOT NULL AND data_correcao_final IS NOT NULL
          THEN EXTRACT(EPOCH FROM (data_correcao_final::timestamp - data_inicio_correcao)) / 86400
        END
      )::numeric, 
      1
    ) as tempo_medio_inicio_fim_correcao,
    COUNT(CASE WHEN data_correcao_final IS NOT NULL THEN 1 END)::bigint as total_apostilas_corrigidas,
    COUNT(CASE WHEN data_entrega IS NOT NULL THEN 1 END)::bigint as total_apostilas_entregues
  FROM apostilas_com_dados;
END;
$function$;