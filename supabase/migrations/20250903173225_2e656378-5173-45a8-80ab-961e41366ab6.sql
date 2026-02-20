-- Função para análise temporal de retenção
CREATE OR REPLACE FUNCTION public.get_resultados_retencao_temporal()
RETURNS TABLE(
  periodo_tipo text,
  periodo_nome text,
  media_dias_retencao numeric,
  total_casos bigint,
  periodo_anterior_media_dias numeric,
  periodo_anterior_total_casos bigint,
  variacao_percentual_anterior numeric,
  mesmo_periodo_ano_anterior_media_dias numeric,
  mesmo_periodo_ano_anterior_total_casos bigint,
  variacao_percentual_ano_anterior numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH dados_retencao AS (
    SELECT 
      a.id as aluno_id,
      a.nome as aluno_nome,
      MIN(r.created_at) as primeira_retencao,
      -- Calcular dias entre primeira retenção e saída (ou data atual se ainda ativo)
      CASE 
        WHEN a.active = false THEN 
          EXTRACT(DAY FROM (NOW() - MIN(r.created_at)))::integer
        ELSE 
          EXTRACT(DAY FROM (NOW() - MIN(r.created_at)))::integer
      END as dias_desde_retencao
    FROM alunos a
    INNER JOIN retencoes r ON a.id = r.aluno_id
    WHERE r.created_at >= DATE_TRUNC('year', CURRENT_DATE - INTERVAL '2 years')
    GROUP BY a.id, a.nome, a.active
  ),
  
  -- Último mês
  ultimo_mes AS (
    SELECT 
      'mes'::text as periodo_tipo,
      TO_CHAR(DATE_TRUNC('month', CURRENT_DATE), 'YYYY-MM')::text as periodo_nome,
      ROUND(AVG(dr.dias_desde_retencao), 1) as media_dias,
      COUNT(*)::bigint as total_casos
    FROM dados_retencao dr
    WHERE dr.primeira_retencao >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
      AND dr.primeira_retencao < DATE_TRUNC('month', CURRENT_DATE)
  ),
  
  -- Mês anterior ao último mês
  mes_anterior AS (
    SELECT 
      ROUND(AVG(dr.dias_desde_retencao), 1) as media_dias,
      COUNT(*)::bigint as total_casos
    FROM dados_retencao dr
    WHERE dr.primeira_retencao >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 month')
      AND dr.primeira_retencao < DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
  ),
  
  -- Mesmo mês ano passado
  mesmo_mes_ano_anterior AS (
    SELECT 
      ROUND(AVG(dr.dias_desde_retencao), 1) as media_dias,
      COUNT(*)::bigint as total_casos
    FROM dados_retencao dr
    WHERE dr.primeira_retencao >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 year' - INTERVAL '1 month')
      AND dr.primeira_retencao < DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 year')
  ),
  
  -- Último trimestre
  ultimo_trimestre AS (
    SELECT 
      'trimestre'::text as periodo_tipo,
      CONCAT(
        EXTRACT(YEAR FROM DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '3 months')),
        'Q',
        EXTRACT(QUARTER FROM DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '3 months'))
      )::text as periodo_nome,
      ROUND(AVG(dr.dias_desde_retencao), 1) as media_dias,
      COUNT(*)::bigint as total_casos
    FROM dados_retencao dr
    WHERE dr.primeira_retencao >= DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '3 months')
      AND dr.primeira_retencao < DATE_TRUNC('quarter', CURRENT_DATE)
  ),
  
  -- Trimestre anterior
  trimestre_anterior AS (
    SELECT 
      ROUND(AVG(dr.dias_desde_retencao), 1) as media_dias,
      COUNT(*)::bigint as total_casos
    FROM dados_retencao dr
    WHERE dr.primeira_retencao >= DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '6 months')
      AND dr.primeira_retencao < DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '3 months')
  ),
  
  -- Mesmo trimestre ano anterior
  mesmo_trimestre_ano_anterior AS (
    SELECT 
      ROUND(AVG(dr.dias_desde_retencao), 1) as media_dias,
      COUNT(*)::bigint as total_casos
    FROM dados_retencao dr
    WHERE dr.primeira_retencao >= DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '1 year' - INTERVAL '3 months')
      AND dr.primeira_retencao < DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '1 year')
  ),
  
  -- Último semestre
  ultimo_semestre AS (
    SELECT 
      'semestre'::text as periodo_tipo,
      CONCAT(
        EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '6 months'),
        'S',
        CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '6 months') <= 6 THEN '1' ELSE '2' END
      )::text as periodo_nome,
      ROUND(AVG(dr.dias_desde_retencao), 1) as media_dias,
      COUNT(*)::bigint as total_casos
    FROM dados_retencao dr
    WHERE dr.primeira_retencao >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
      AND dr.primeira_retencao < DATE_TRUNC('month', CURRENT_DATE)
  ),
  
  -- Semestre anterior
  semestre_anterior AS (
    SELECT 
      ROUND(AVG(dr.dias_desde_retencao), 1) as media_dias,
      COUNT(*)::bigint as total_casos
    FROM dados_retencao dr
    WHERE dr.primeira_retencao >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
      AND dr.primeira_retencao < DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
  ),
  
  -- Mesmo semestre ano anterior
  mesmo_semestre_ano_anterior AS (
    SELECT 
      ROUND(AVG(dr.dias_desde_retencao), 1) as media_dias,
      COUNT(*)::bigint as total_casos
    FROM dados_retencao dr
    WHERE dr.primeira_retencao >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '18 months')
      AND dr.primeira_retencao < DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
  ),
  
  -- Este ano
  este_ano AS (
    SELECT 
      'ano'::text as periodo_tipo,
      EXTRACT(YEAR FROM CURRENT_DATE)::text as periodo_nome,
      ROUND(AVG(dr.dias_desde_retencao), 1) as media_dias,
      COUNT(*)::bigint as total_casos
    FROM dados_retencao dr
    WHERE dr.primeira_retencao >= DATE_TRUNC('year', CURRENT_DATE)
  ),
  
  -- Ano anterior
  ano_anterior AS (
    SELECT 
      ROUND(AVG(dr.dias_desde_retencao), 1) as media_dias,
      COUNT(*)::bigint as total_casos
    FROM dados_retencao dr
    WHERE dr.primeira_retencao >= DATE_TRUNC('year', CURRENT_DATE - INTERVAL '1 year')
      AND dr.primeira_retencao < DATE_TRUNC('year', CURRENT_DATE)
  )
  
  -- União de todos os períodos
  SELECT 
    um.periodo_tipo,
    um.periodo_nome,
    COALESCE(um.media_dias, 0) as media_dias_retencao,
    COALESCE(um.total_casos, 0) as total_casos,
    COALESCE(ma.media_dias, 0) as periodo_anterior_media_dias,
    COALESCE(ma.total_casos, 0) as periodo_anterior_total_casos,
    CASE 
      WHEN ma.media_dias IS NULL OR ma.media_dias = 0 THEN 0
      ELSE ROUND(((um.media_dias - ma.media_dias) / ma.media_dias * 100), 1)
    END as variacao_percentual_anterior,
    COALESCE(mmaa.media_dias, 0) as mesmo_periodo_ano_anterior_media_dias,
    COALESCE(mmaa.total_casos, 0) as mesmo_periodo_ano_anterior_total_casos,
    CASE 
      WHEN mmaa.media_dias IS NULL OR mmaa.media_dias = 0 THEN 0
      ELSE ROUND(((um.media_dias - mmaa.media_dias) / mmaa.media_dias * 100), 1)
    END as variacao_percentual_ano_anterior
  FROM ultimo_mes um
  CROSS JOIN mes_anterior ma
  CROSS JOIN mesmo_mes_ano_anterior mmaa
  
  UNION ALL
  
  SELECT 
    ut.periodo_tipo,
    ut.periodo_nome,
    COALESCE(ut.media_dias, 0) as media_dias_retencao,
    COALESCE(ut.total_casos, 0) as total_casos,
    COALESCE(ta.media_dias, 0) as periodo_anterior_media_dias,
    COALESCE(ta.total_casos, 0) as periodo_anterior_total_casos,
    CASE 
      WHEN ta.media_dias IS NULL OR ta.media_dias = 0 THEN 0
      ELSE ROUND(((ut.media_dias - ta.media_dias) / ta.media_dias * 100), 1)
    END as variacao_percentual_anterior,
    COALESCE(mtaa.media_dias, 0) as mesmo_periodo_ano_anterior_media_dias,
    COALESCE(mtaa.total_casos, 0) as mesmo_periodo_ano_anterior_total_casos,
    CASE 
      WHEN mtaa.media_dias IS NULL OR mtaa.media_dias = 0 THEN 0
      ELSE ROUND(((ut.media_dias - mtaa.media_dias) / mtaa.media_dias * 100), 1)
    END as variacao_percentual_ano_anterior
  FROM ultimo_trimestre ut
  CROSS JOIN trimestre_anterior ta
  CROSS JOIN mesmo_trimestre_ano_anterior mtaa
  
  UNION ALL
  
  SELECT 
    us.periodo_tipo,
    us.periodo_nome,
    COALESCE(us.media_dias, 0) as media_dias_retencao,
    COALESCE(us.total_casos, 0) as total_casos,
    COALESCE(sa.media_dias, 0) as periodo_anterior_media_dias,
    COALESCE(sa.total_casos, 0) as periodo_anterior_total_casos,
    CASE 
      WHEN sa.media_dias IS NULL OR sa.media_dias = 0 THEN 0
      ELSE ROUND(((us.media_dias - sa.media_dias) / sa.media_dias * 100), 1)
    END as variacao_percentual_anterior,
    COALESCE(msaa.media_dias, 0) as mesmo_periodo_ano_anterior_media_dias,
    COALESCE(msaa.total_casos, 0) as mesmo_periodo_ano_anterior_total_casos,
    CASE 
      WHEN msaa.media_dias IS NULL OR msaa.media_dias = 0 THEN 0
      ELSE ROUND(((us.media_dias - msaa.media_dias) / msaa.media_dias * 100), 1)
    END as variacao_percentual_ano_anterior
  FROM ultimo_semestre us
  CROSS JOIN semestre_anterior sa
  CROSS JOIN mesmo_semestre_ano_anterior msaa
  
  UNION ALL
  
  SELECT 
    ea.periodo_tipo,
    ea.periodo_nome,
    COALESCE(ea.media_dias, 0) as media_dias_retencao,
    COALESCE(ea.total_casos, 0) as total_casos,
    COALESCE(aa.media_dias, 0) as periodo_anterior_media_dias,
    COALESCE(aa.total_casos, 0) as periodo_anterior_total_casos,
    CASE 
      WHEN aa.media_dias IS NULL OR aa.media_dias = 0 THEN 0
      ELSE ROUND(((ea.media_dias - aa.media_dias) / aa.media_dias * 100), 1)
    END as variacao_percentual_anterior,
    COALESCE(aa.media_dias, 0) as mesmo_periodo_ano_anterior_media_dias,
    COALESCE(aa.total_casos, 0) as mesmo_periodo_ano_anterior_total_casos,
    CASE 
      WHEN aa.media_dias IS NULL OR aa.media_dias = 0 THEN 0
      ELSE ROUND(((ea.media_dias - aa.media_dias) / aa.media_dias * 100), 1)
    END as variacao_percentual_ano_anterior
  FROM este_ano ea
  CROSS JOIN ano_anterior aa
  
  ORDER BY 
    CASE 
      WHEN periodo_tipo = 'mes' THEN 1
      WHEN periodo_tipo = 'trimestre' THEN 2
      WHEN periodo_tipo = 'semestre' THEN 3
      WHEN periodo_tipo = 'ano' THEN 4
    END;
END;
$$;