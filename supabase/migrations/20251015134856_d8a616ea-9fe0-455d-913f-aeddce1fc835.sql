-- Corrigir função get_calendario_turmas_semana_com_reposicoes para extrair horario_inicio e categoria do nome
DROP FUNCTION IF EXISTS public.get_calendario_turmas_semana_com_reposicoes(date, date);

CREATE OR REPLACE FUNCTION public.get_calendario_turmas_semana_com_reposicoes(
  p_data_inicio date,
  p_data_fim date
)
RETURNS TABLE(
  turma_id uuid,
  unit_id uuid,
  nome_completo text,
  dia_semana dia_semana,
  sala text,
  professor_id uuid,
  professor_nome text,
  professor_slack text,
  horario_inicio text,
  categoria text,
  total_alunos_ativos bigint,
  total_reposicoes bigint,
  total_aulas_experimentais bigint,
  total_faltas_futuras bigint,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    t.id AS turma_id,
    t.unit_id,
    t.nome AS nome_completo,
    t.dia_semana,
    t.sala,
    t.professor_id,
    p.nome AS professor_nome,
    p.slack_username AS professor_slack,
    substring(t.nome from '\((\d{2}:\d{2})') AS horario_inicio,
    substring(t.nome from '-\s*([^)]+)\)') AS categoria,
    COALESCE((SELECT COUNT(*)::bigint FROM alunos a WHERE a.turma_id = t.id AND a.active = true), 0) AS total_alunos_ativos,
    COALESCE((SELECT COUNT(*)::bigint FROM reposicoes r WHERE r.turma_id = t.id AND r.data_reposicao BETWEEN p_data_inicio AND p_data_fim), 0) AS total_reposicoes,
    COALESCE((SELECT COUNT(*)::bigint FROM aulas_experimentais ae WHERE ae.turma_id = t.id AND ae.active = true AND ae.data_aula_experimental BETWEEN p_data_inicio AND p_data_fim), 0) AS total_aulas_experimentais,
    COALESCE((SELECT COUNT(*)::bigint FROM faltas_futuras ff WHERE ff.turma_id = t.id AND ff.active = true AND ff.data_falta BETWEEN p_data_inicio AND p_data_fim), 0) AS total_faltas_futuras,
    t.created_at
  FROM turmas t
  LEFT JOIN professores p ON t.professor_id = p.id
  WHERE t.active = true
    AND (t.projeto IS NULL OR t.projeto = false)
  ORDER BY
    CASE
      WHEN substring(t.nome from '\((\d{2}:\d{2})') IS NOT NULL
      THEN (substring(t.nome from '\((\d{2}:\d{2})'))::time
      ELSE NULL
    END NULLS LAST,
    t.nome;
END;
$function$;