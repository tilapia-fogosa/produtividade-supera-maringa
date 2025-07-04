
-- Atualizar função para filtrar UUIDs órfãos e mostrar apenas professores/funcionários válidos
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
  WITH dados_com_nomes AS (
    SELECT
      pa.*,
      COALESCE(
        prof.nome,
        func.nome,
        CASE 
          WHEN pa.professor_correcao ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN NULL
          ELSE pa.professor_correcao
        END
      ) as nome_final
    FROM produtividade_ah pa
    LEFT JOIN professores prof ON prof.id::text = pa.professor_correcao
    LEFT JOIN funcionarios func ON func.id::text = pa.professor_correcao
    WHERE pa.professor_correcao IS NOT NULL
      AND pa.created_at >= CURRENT_DATE - INTERVAL '12 months'
  ),
  stats_por_professor AS (
    SELECT
      dcn.nome_final as professor_correcao,
      -- Mês atual
      COALESCE(SUM(CASE 
        WHEN EXTRACT(YEAR FROM dcn.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM dcn.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        THEN dcn.exercicios ELSE 0 END), 0) AS mes_atual,
      
      -- Mês anterior
      COALESCE(SUM(CASE 
        WHEN dcn.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND dcn.created_at < DATE_TRUNC('month', CURRENT_DATE)
        THEN dcn.exercicios ELSE 0 END), 0) AS mes_anterior,
      
      -- Últimos 3 meses
      COALESCE(SUM(CASE 
        WHEN dcn.created_at >= CURRENT_DATE - INTERVAL '3 months'
        THEN dcn.exercicios ELSE 0 END), 0) AS ultimos_3_meses,
      
      -- Últimos 6 meses
      COALESCE(SUM(CASE 
        WHEN dcn.created_at >= CURRENT_DATE - INTERVAL '6 months'
        THEN dcn.exercicios ELSE 0 END), 0) AS ultimos_6_meses,
      
      -- Últimos 12 meses
      COALESCE(SUM(CASE 
        WHEN dcn.created_at >= CURRENT_DATE - INTERVAL '12 months'
        THEN dcn.exercicios ELSE 0 END), 0) AS ultimos_12_meses
      
    FROM dados_com_nomes dcn
    WHERE dcn.nome_final IS NOT NULL
    GROUP BY dcn.nome_final
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
