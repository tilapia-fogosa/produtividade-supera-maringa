-- Corrigir função para usar calendario_turmas_view ao invés da tabela turmas
CREATE OR REPLACE FUNCTION public.get_calendario_turmas_com_reposicoes(p_data_consulta date)
 RETURNS TABLE(turma_id uuid, unit_id uuid, nome_completo text, dia_semana dia_semana, sala text, professor_id uuid, professor_nome text, professor_slack text, horario_inicio text, categoria text, total_alunos_ativos bigint, total_reposicoes bigint, created_at timestamp with time zone)
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
    COALESCE(COUNT(r.id) FILTER (WHERE r.data_reposicao = p_data_consulta), 0) as total_reposicoes,
    ctv.created_at
  FROM calendario_turmas_view ctv
  LEFT JOIN reposicoes r ON r.turma_id = ctv.turma_id AND r.data_reposicao = p_data_consulta
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
$function$;