-- Corrigir função get_resultados_retencao_temporal para resolver ambiguidade e ajustar filtros temporais
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
  
  -- Mês atual (se tiver dados) ou último mês completo
  mes_atual AS (
    SELECT 
      'mes'::text as tipo_periodo,
      TO_CHAR(CURRENT_DATE, 'YYYY-MM')::text as nome_periodo,
      ROUND(AVG(dr.dias_desde_retencao), 1) as media_dias,
      COUNT(*)::bigint as total_casos
    FROM dados_retencao dr
    WHERE dr.primeira_retencao >= DATE_TRUNC('month', CURRENT_DATE)
      AND dr.primeira_retencao < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    HAVING COUNT(*) > 0
    
    UNION ALL
    
    -- Se não tiver dados no mês atual, usar o mês anterior
    SELECT 
      'mes'::text as tipo_periodo,
      TO_CHAR(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'), 'YYYY-MM')::text as nome_periodo,
      ROUND(AVG(dr.dias_desde_retencao), 1) as media_dias,
      COUNT(*)::bigint as total_casos
    FROM dados_retencao dr
    WHERE dr.primeira_retencao >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
      AND dr.primeira_retencao < DATE_TRUNC('month', CURRENT_DATE)
      AND NOT EXISTS (
        SELECT 1 FROM dados_retencao dr2
        WHERE dr2.primeira_retencao >= DATE_TRUNC('month', CURRENT_DATE)
          AND dr2.primeira_retencao < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
      )
  ),
  
  -- Mês anterior ao período selecionado
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
    WHERE dr.primeira_retencao >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 year')
      AND dr.primeira_retencao < DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 year') + INTERVAL '1 month'
  ),
  
  -- Trimestre atual ou último completo
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
      AND dr.primeira_retencao < DATE_TRUNC('quarter', CURRENT_DATE) + INTERVAL '3 months'
    HAVING COUNT(*) > 0
    
    UNION ALL
    
    -- Se não tiver dados no trimestre atual, usar o anterior
    SELECT 
      'trimestre'::text as tipo_periodo,
      CONCAT(
        EXTRACT(YEAR FROM DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '3 months')),
        'Q',
        EXTRACT(QUARTER FROM DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '3 months'))
      )::text as nome_periodo,
      ROUND(AVG(dr.dias_desde_retencao), 1) as media_dias,
      COUNT(*)::bigint as total_casos
    FROM dados_retencao dr
    WHERE dr.primeira_retencao >= DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '3 months')
      AND dr.primeira_retencao < DATE_TRUNC('quarter', CURRENT_DATE)
      AND NOT EXISTS (
        SELECT 1 FROM dados_retencao dr2
        WHERE dr2.primeira_retencao >= DATE_TRUNC('quarter', CURRENT_DATE)
          AND dr2.primeira_retencao < DATE_TRUNC('quarter', CURRENT_DATE) + INTERVAL '3 months'
      )
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
      AND dr.primeira_retencao < DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year'
  ),
  
  -- Ano anterior
  ano_anterior AS (
    SELECT 
      ROUND(AVG(dr.dias_desde_retencao), 1) as media_dias,
      COUNT(*)::bigint as total_casos
    FROM dados_retencao dr
    WHERE dr.primeira_retencao >= DATE_TRUNC('year', CURRENT_DATE - INTERVAL '1 year')
      AND dr.primeira_retencao < DATE_TRUNC('year', CURRENT_DATE)
  ),
  
  -- Resultados consolidados
  resultados_finais AS (
    -- Dados mensais
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
      END as variacao_percentual_ano_anterior,
      1 as ordem
    FROM mes_atual ma
    CROSS JOIN mes_anterior mant
    CROSS JOIN mesmo_mes_ano_anterior mmaa
    LIMIT 1
    
    UNION ALL
    
    -- Dados trimestrais
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
      END as variacao_percentual_ano_anterior,
      2 as ordem
    FROM trimestre_atual ta
    CROSS JOIN trimestre_anterior tant
    CROSS JOIN mesmo_trimestre_ano_anterior mtaa
    LIMIT 1
    
    UNION ALL
    
    -- Dados anuais
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
      END as variacao_percentual_ano_anterior,
      3 as ordem
    FROM ano_atual aa
    CROSS JOIN ano_anterior aant
  )
  
  SELECT 
    rf.periodo_tipo,
    rf.periodo_nome,
    rf.media_dias_retencao,
    rf.total_casos,
    rf.periodo_anterior_media_dias,
    rf.periodo_anterior_total_casos,
    rf.variacao_percentual_anterior,
    rf.mesmo_periodo_ano_anterior_media_dias,
    rf.mesmo_periodo_ano_anterior_total_casos,
    rf.variacao_percentual_ano_anterior
  FROM resultados_finais rf
  ORDER BY rf.ordem;
END;
$function$;