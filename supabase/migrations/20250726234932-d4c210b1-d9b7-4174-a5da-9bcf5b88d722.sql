-- Drop e recriar função para incluir contagem de aulas experimentais
DROP FUNCTION IF EXISTS public.get_calendario_turmas_semana_com_reposicoes(date, date);

CREATE OR REPLACE FUNCTION public.get_calendario_turmas_semana_com_reposicoes(p_data_inicio date, p_data_fim date)
 RETURNS TABLE(turma_id uuid, unit_id uuid, nome_completo text, dia_semana dia_semana, sala text, professor_id uuid, professor_nome text, professor_slack text, horario_inicio text, categoria text, total_alunos_ativos bigint, total_reposicoes bigint, total_aulas_experimentais bigint, created_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ctv.turma_id,
    ctv.unit_id,
    ctv.nome_completo,
    ctv.dia_semana,
    ctv.sala,
    ctv.professor_id,
    ctv.professor_nome,
    ctv.professor_slack,
    ctv.horario_inicio,
    ctv.categoria,
    ctv.total_alunos_ativos,
    COALESCE(COUNT(r.id) FILTER (WHERE r.data_reposicao BETWEEN p_data_inicio AND p_data_fim), 0) as total_reposicoes,
    COALESCE(COUNT(ae.id) FILTER (WHERE ae.data_aula_experimental BETWEEN p_data_inicio AND p_data_fim), 0) as total_aulas_experimentais,
    ctv.created_at
  FROM calendario_turmas_view ctv
  LEFT JOIN reposicoes r ON r.turma_id = ctv.turma_id 
    AND r.data_reposicao BETWEEN p_data_inicio AND p_data_fim
  LEFT JOIN aulas_experimentais ae ON ae.turma_id = ctv.turma_id
    AND ae.data_aula_experimental BETWEEN p_data_inicio AND p_data_fim
  GROUP BY 
    ctv.turma_id, 
    ctv.unit_id, 
    ctv.nome_completo, 
    ctv.dia_semana, 
    ctv.sala, 
    ctv.professor_id, 
    ctv.professor_nome, 
    ctv.professor_slack, 
    ctv.horario_inicio, 
    ctv.categoria, 
    ctv.total_alunos_ativos,
    ctv.created_at
  ORDER BY ctv.horario_inicio, ctv.nome_completo;
END;
$function$