
-- Função RPC para buscar estatísticas de correções de Abrindo Horizontes por professor
CREATE OR REPLACE FUNCTION get_correcoes_ah_stats()
RETURNS TABLE(
  professor_correcao text,
  mes_atual bigint,
  mes_anterior bigint,
  ultimos_3_meses bigint,
  ultimos_6_meses bigint,
  ultimos_12_meses bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH periodo_base AS (
    SELECT
      professor_correcao,
      COALESCE(SUM(exercicios), 0) AS total_exercicios,
      created_at
    FROM produtividade_ah
    WHERE professor_correcao IS NOT NULL
      AND created_at >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY professor_correcao, created_at
  ),
  stats_por_professor AS (
    SELECT
      pa.professor_correcao,
      -- Mês atual
      COALESCE(SUM(CASE 
        WHEN EXTRACT(YEAR FROM pa.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM pa.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        THEN pa.exercicios ELSE 0 END), 0) AS mes_atual,
      
      -- Mês anterior
      COALESCE(SUM(CASE 
        WHEN pa.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND pa.created_at < DATE_TRUNC('month', CURRENT_DATE)
        THEN pa.exercicios ELSE 0 END), 0) AS mes_anterior,
      
      -- Últimos 3 meses
      COALESCE(SUM(CASE 
        WHEN pa.created_at >= CURRENT_DATE - INTERVAL '3 months'
        THEN pa.exercicios ELSE 0 END), 0) AS ultimos_3_meses,
      
      -- Últimos 6 meses
      COALESCE(SUM(CASE 
        WHEN pa.created_at >= CURRENT_DATE - INTERVAL '6 months'
        THEN pa.exercicios ELSE 0 END), 0) AS ultimos_6_meses,
      
      -- Últimos 12 meses
      COALESCE(SUM(pa.exercicios), 0) AS ultimos_12_meses
      
    FROM produtividade_ah pa
    WHERE pa.professor_correcao IS NOT NULL
      AND pa.created_at >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY pa.professor_correcao
  )
  SELECT 
    s.professor_correcao,
    s.mes_atual,
    s.mes_anterior,
    s.ultimos_3_meses,
    s.ultimos_6_meses,
    s.ultimos_12_meses
  FROM stats_por_professor s
  ORDER BY s.ultimos_12_meses DESC, s.professor_correcao;
END;
$$;
