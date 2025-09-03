-- Reescrevendo completamente a função get_resultados_retencao_temporal
-- para resolver problemas de divisão por zero e casos limite

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
AS $function$
DECLARE
  -- Mês atual
  mes_atual_media numeric;
  mes_atual_casos bigint;
  mes_anterior_media numeric;
  mes_anterior_casos bigint;
  mes_ano_anterior_media numeric;
  mes_ano_anterior_casos bigint;
  
  -- Trimestre atual
  trim_atual_media numeric;
  trim_atual_casos bigint;
  trim_anterior_media numeric;
  trim_anterior_casos bigint;
  trim_ano_anterior_media numeric;
  trim_ano_anterior_casos bigint;
  
  -- Ano atual
  ano_atual_media numeric;
  ano_atual_casos bigint;
  ano_anterior_media numeric;
  ano_anterior_casos bigint;
BEGIN
  -- Calcular dados do mês atual (setembro 2025)
  SELECT 
    COALESCE(ROUND(AVG(EXTRACT(DAY FROM (NOW() - r.created_at))), 1), 0),
    COUNT(*)
  INTO mes_atual_media, mes_atual_casos
  FROM retencoes r
  INNER JOIN alunos a ON r.aluno_id = a.id
  WHERE r.created_at >= DATE_TRUNC('month', CURRENT_DATE)
    AND r.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

  -- Calcular dados do mês anterior (agosto 2025)
  SELECT 
    COALESCE(ROUND(AVG(EXTRACT(DAY FROM (NOW() - r.created_at))), 1), 0),
    COUNT(*)
  INTO mes_anterior_media, mes_anterior_casos
  FROM retencoes r
  INNER JOIN alunos a ON r.aluno_id = a.id
  WHERE r.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    AND r.created_at < DATE_TRUNC('month', CURRENT_DATE);

  -- Calcular dados do mesmo mês do ano anterior (setembro 2024)
  SELECT 
    COALESCE(ROUND(AVG(EXTRACT(DAY FROM (NOW() - r.created_at))), 1), 0),
    COUNT(*)
  INTO mes_ano_anterior_media, mes_ano_anterior_casos
  FROM retencoes r
  INNER JOIN alunos a ON r.aluno_id = a.id
  WHERE r.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 year')
    AND r.created_at < DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 year') + INTERVAL '1 month';

  -- Calcular dados do trimestre atual
  SELECT 
    COALESCE(ROUND(AVG(EXTRACT(DAY FROM (NOW() - r.created_at))), 1), 0),
    COUNT(*)
  INTO trim_atual_media, trim_atual_casos
  FROM retencoes r
  INNER JOIN alunos a ON r.aluno_id = a.id
  WHERE r.created_at >= DATE_TRUNC('quarter', CURRENT_DATE)
    AND r.created_at < DATE_TRUNC('quarter', CURRENT_DATE) + INTERVAL '3 months';

  -- Calcular dados do trimestre anterior
  SELECT 
    COALESCE(ROUND(AVG(EXTRACT(DAY FROM (NOW() - r.created_at))), 1), 0),
    COUNT(*)
  INTO trim_anterior_media, trim_anterior_casos
  FROM retencoes r
  INNER JOIN alunos a ON r.aluno_id = a.id
  WHERE r.created_at >= DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '3 months')
    AND r.created_at < DATE_TRUNC('quarter', CURRENT_DATE);

  -- Calcular dados do mesmo trimestre do ano anterior
  SELECT 
    COALESCE(ROUND(AVG(EXTRACT(DAY FROM (NOW() - r.created_at))), 1), 0),
    COUNT(*)
  INTO trim_ano_anterior_media, trim_ano_anterior_casos
  FROM retencoes r
  INNER JOIN alunos a ON r.aluno_id = a.id
  WHERE r.created_at >= DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '1 year')
    AND r.created_at < DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '1 year') + INTERVAL '3 months';

  -- Calcular dados do ano atual
  SELECT 
    COALESCE(ROUND(AVG(EXTRACT(DAY FROM (NOW() - r.created_at))), 1), 0),
    COUNT(*)
  INTO ano_atual_media, ano_atual_casos
  FROM retencoes r
  INNER JOIN alunos a ON r.aluno_id = a.id
  WHERE r.created_at >= DATE_TRUNC('year', CURRENT_DATE)
    AND r.created_at < DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year';

  -- Calcular dados do ano anterior
  SELECT 
    COALESCE(ROUND(AVG(EXTRACT(DAY FROM (NOW() - r.created_at))), 1), 0),
    COUNT(*)
  INTO ano_anterior_media, ano_anterior_casos
  FROM retencoes r
  INNER JOIN alunos a ON r.aluno_id = a.id
  WHERE r.created_at >= DATE_TRUNC('year', CURRENT_DATE - INTERVAL '1 year')
    AND r.created_at < DATE_TRUNC('year', CURRENT_DATE);

  -- Retornar os resultados (apenas se houver dados no período atual)
  
  -- Mês atual
  IF mes_atual_casos > 0 THEN
    RETURN QUERY SELECT 
      'mes'::text,
      TO_CHAR(CURRENT_DATE, 'YYYY-MM')::text,
      mes_atual_media,
      mes_atual_casos,
      mes_anterior_media,
      mes_anterior_casos,
      CASE 
        WHEN mes_anterior_media > 0 THEN ROUND(((mes_atual_media - mes_anterior_media) / mes_anterior_media * 100), 1)
        ELSE 0
      END,
      mes_ano_anterior_media,
      mes_ano_anterior_casos,
      CASE 
        WHEN mes_ano_anterior_media > 0 THEN ROUND(((mes_atual_media - mes_ano_anterior_media) / mes_ano_anterior_media * 100), 1)
        ELSE 0
      END;
  END IF;

  -- Trimestre atual
  IF trim_atual_casos > 0 THEN
    RETURN QUERY SELECT 
      'trimestre'::text,
      CONCAT(EXTRACT(YEAR FROM CURRENT_DATE), 'Q', EXTRACT(QUARTER FROM CURRENT_DATE))::text,
      trim_atual_media,
      trim_atual_casos,
      trim_anterior_media,
      trim_anterior_casos,
      CASE 
        WHEN trim_anterior_media > 0 THEN ROUND(((trim_atual_media - trim_anterior_media) / trim_anterior_media * 100), 1)
        ELSE 0
      END,
      trim_ano_anterior_media,
      trim_ano_anterior_casos,
      CASE 
        WHEN trim_ano_anterior_media > 0 THEN ROUND(((trim_atual_media - trim_ano_anterior_media) / trim_ano_anterior_media * 100), 1)
        ELSE 0
      END;
  END IF;

  -- Ano atual
  IF ano_atual_casos > 0 THEN
    RETURN QUERY SELECT 
      'ano'::text,
      EXTRACT(YEAR FROM CURRENT_DATE)::text,
      ano_atual_media,
      ano_atual_casos,
      ano_anterior_media,
      ano_anterior_casos,
      CASE 
        WHEN ano_anterior_media > 0 THEN ROUND(((ano_atual_media - ano_anterior_media) / ano_anterior_media * 100), 1)
        ELSE 0
      END,
      ano_anterior_media,
      ano_anterior_casos,
      CASE 
        WHEN ano_anterior_media > 0 THEN ROUND(((ano_atual_media - ano_anterior_media) / ano_anterior_media * 100), 1)
        ELSE 0
      END;
  END IF;

END;
$function$;