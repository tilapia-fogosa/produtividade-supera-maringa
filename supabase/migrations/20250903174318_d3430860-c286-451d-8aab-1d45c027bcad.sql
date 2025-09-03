-- Corrigir função get_resultados_retencao_temporal com abordagem simplificada
DROP FUNCTION IF EXISTS public.get_resultados_retencao_temporal();

CREATE OR REPLACE FUNCTION public.get_resultados_retencao_temporal()
 RETURNS TABLE(periodo_tipo text, periodo_nome text, media_dias_retencao numeric, total_casos bigint, periodo_anterior_media_dias numeric, periodo_anterior_total_casos bigint, variacao_percentual_anterior numeric, mesmo_periodo_ano_anterior_media_dias numeric, mesmo_periodo_ano_anterior_total_casos bigint, variacao_percentual_ano_anterior numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH dados_retencao AS (
    SELECT 
      a.id as aluno_id,
      a.nome as aluno_nome,
      MIN(r.created_at) as primeira_retencao,
      EXTRACT(DAY FROM (NOW() - MIN(r.created_at)))::integer as dias_desde_retencao
    FROM alunos a
    INNER JOIN retencoes r ON a.id = r.aluno_id
    WHERE r.created_at >= DATE_TRUNC('year', CURRENT_DATE - INTERVAL '2 years')
    GROUP BY a.id, a.nome, a.active
  ),
  
  -- Mês atual
  mes_atual AS (
    SELECT 
      'mes'::text as tipo_periodo,
      TO_CHAR(CURRENT_DATE, 'YYYY-MM')::text as nome_periodo,
      ROUND(AVG(dr.dias_desde_retencao), 1) as media_dias,
      COUNT(*)::bigint as total_casos
    FROM dados_retencao dr
    WHERE dr.primeira_retencao >= DATE_TRUNC('month', CURRENT_DATE)
  ),
  
  -- Mês anterior
  mes_anterior AS (
    SELECT 
      ROUND(AVG(dr.dias_desde_retencao), 1) as media_dias,
      COUNT(*)::bigint as total_casos
    FROM dados_retencao dr
    WHERE dr.primeira_retencao >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
      AND dr.primeira_retencao < DATE_TRUNC('month', CURRENT_DATE)
  ),
  
  -- Mesmo mês ano anterior
  mesmo_mes_ano_anterior AS (
    SELECT 
      ROUND(AVG(dr.dias_desde_retencao), 1) as media_dias,
      COUNT(*)::bigint as total_casos
    FROM dados_retencao dr
    WHERE dr.primeira_retencao >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 year')
      AND dr.primeira_retencao < DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 year') + INTERVAL '1 month'
  ),
  
  -- Trimestre atual
  trimestre_atual AS (
    SELECT 
      'trimestre'::text as tipo_periodo,
      CONCAT(
        EXTRACT(YEAR FROM CURRENT_DATE),
        'Q',
        EXTRACT(QUARTER FROM CURRENT_DATE)
      )::text as nome_periodo,
      ROUND(AVG(dr.dias_desde_retencao), 1) as media_dias,
      COUNT(*)::bigint as total_casos
    FROM dados_retencao dr
    WHERE dr.primeira_retencao >= DATE_TRUNC('quarter', CURRENT_DATE)
  ),
  
  -- Trimestre anterior
  trimestre_anterior AS (
    SELECT 
      ROUND(AVG(dr.dias_desde_retencao), 1) as media_dias,
      COUNT(*)::bigint as total_casos
    FROM dados_retencao dr
    WHERE dr.primeira_retencao >= DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '3 months')
      AND dr.primeira_retencao < DATE_TRUNC('quarter', CURRENT_DATE)
  ),
  
  -- Mesmo trimestre ano anterior
  mesmo_trimestre_ano_anterior AS (
    SELECT 
      ROUND(AVG(dr.dias_desde_retencao), 1) as media_dias,
      COUNT(*)::bigint as total_casos
    FROM dados_retencao dr
    WHERE dr.primeira_retencao >= DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '1 year')
      AND dr.primeira_retencao < DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '1 year') + INTERVAL '3 months'
  ),
  
  -- Ano atual
  ano_atual AS (
    SELECT 
      'ano'::text as tipo_periodo,
      EXTRACT(YEAR FROM CURRENT_DATE)::text as nome_periodo,
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
  
  -- Consolidar resultados
  SELECT 
    ma.tipo_periodo as periodo_tipo,
    ma.nome_periodo as periodo_nome,
    COALESCE(ma.media_dias, 0) as media_dias_retencao,
    COALESCE(ma.total_casos, 0) as total_casos,
    COALESCE(mant.media_dias, 0) as periodo_anterior_media_dias,
    COALESCE(mant.total_casos, 0) as periodo_anterior_total_casos,
    CASE 
      WHEN mant.media_dias IS NULL OR mant.media_dias = 0 THEN 0
      ELSE ROUND(((ma.media_dias - mant.media_dias) / mant.media_dias * 100), 1)
    END as variacao_percentual_anterior,
    COALESCE(mmaa.media_dias, 0) as mesmo_periodo_ano_anterior_media_dias,
    COALESCE(mmaa.total_casos, 0) as mesmo_periodo_ano_anterior_total_casos,
    CASE 
      WHEN mmaa.media_dias IS NULL OR mmaa.media_dias = 0 THEN 0
      ELSE ROUND(((ma.media_dias - mmaa.media_dias) / mmaa.media_dias * 100), 1)
    END as variacao_percentual_ano_anterior
  FROM mes_atual ma
  CROSS JOIN mes_anterior mant
  CROSS JOIN mesmo_mes_ano_anterior mmaa
  WHERE ma.total_casos > 0 OR mant.total_casos > 0
  
  UNION ALL
  
  SELECT 
    ta.tipo_periodo as periodo_tipo,
    ta.nome_periodo as periodo_nome,
    COALESCE(ta.media_dias, 0) as media_dias_retencao,
    COALESCE(ta.total_casos, 0) as total_casos,
    COALESCE(tant.media_dias, 0) as periodo_anterior_media_dias,
    COALESCE(tant.total_casos, 0) as periodo_anterior_total_casos,
    CASE 
      WHEN tant.media_dias IS NULL OR tant.media_dias = 0 THEN 0
      ELSE ROUND(((ta.media_dias - tant.media_dias) / tant.media_dias * 100), 1)
    END as variacao_percentual_anterior,
    COALESCE(mtaa.media_dias, 0) as mesmo_periodo_ano_anterior_media_dias,
    COALESCE(mtaa.total_casos, 0) as mesmo_periodo_ano_anterior_total_casos,
    CASE 
      WHEN mtaa.media_dias IS NULL OR mtaa.media_dias = 0 THEN 0
      ELSE ROUND(((ta.media_dias - mtaa.media_dias) / mtaa.media_dias * 100), 1)
    END as variacao_percentual_ano_anterior
  FROM trimestre_atual ta
  CROSS JOIN trimestre_anterior tant
  CROSS JOIN mesmo_trimestre_ano_anterior mtaa
  WHERE ta.total_casos > 0 OR tant.total_casos > 0
  
  UNION ALL
  
  SELECT 
    aa.tipo_periodo as periodo_tipo,
    aa.nome_periodo as periodo_nome,
    COALESCE(aa.media_dias, 0) as media_dias_retencao,
    COALESCE(aa.total_casos, 0) as total_casos,
    COALESCE(aant.media_dias, 0) as periodo_anterior_media_dias,
    COALESCE(aant.total_casos, 0) as periodo_anterior_total_casos,
    CASE 
      WHEN aant.media_dias IS NULL OR aant.media_dias = 0 THEN 0
      ELSE ROUND(((aa.media_dias - aant.media_dias) / aant.media_dias * 100), 1)
    END as variacao_percentual_anterior,
    COALESCE(aant.media_dias, 0) as mesmo_periodo_ano_anterior_media_dias,
    COALESCE(aant.total_casos, 0) as mesmo_periodo_ano_anterior_total_casos,
    CASE 
      WHEN aant.media_dias IS NULL OR aant.media_dias = 0 THEN 0
      ELSE ROUND(((aa.media_dias - aant.media_dias) / aant.media_dias * 100), 1)
    END as variacao_percentual_ano_anterior
  FROM ano_atual aa
  CROSS JOIN ano_anterior aant
  WHERE aa.total_casos > 0 OR aant.total_casos > 0
  
  ORDER BY 
    CASE 
      WHEN periodo_tipo = 'mes' THEN 1
      WHEN periodo_tipo = 'trimestre' THEN 2
      WHEN periodo_tipo = 'ano' THEN 3
    END;
END;
$function$;