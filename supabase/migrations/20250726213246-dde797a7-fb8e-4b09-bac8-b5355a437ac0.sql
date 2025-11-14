-- Criar função para buscar calendário de turmas com reposições para uma data específica
CREATE OR REPLACE FUNCTION public.get_calendario_turmas_com_reposicoes(p_data_consulta DATE)
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
  created_at timestamp with time zone
)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as turma_id,
    t.unit_id,
    t.nome as nome_completo,
    t.dia_semana,
    t.sala,
    t.professor_id,
    p.nome as professor_nome,
    p.slack_username as professor_slack,
    t.horario_inicio,
    t.categoria,
    COUNT(a.id) FILTER (WHERE a.active = true) as total_alunos_ativos,
    COALESCE(COUNT(r.id) FILTER (WHERE r.data_reposicao = p_data_consulta), 0) as total_reposicoes,
    t.created_at
  FROM turmas t
  LEFT JOIN professores p ON t.professor_id = p.id
  LEFT JOIN alunos a ON a.turma_id = t.id AND a.active = true
  LEFT JOIN reposicoes r ON r.turma_id = t.id AND r.data_reposicao = p_data_consulta
  WHERE t.active = true
  GROUP BY 
    t.id, 
    t.unit_id, 
    t.nome, 
    t.dia_semana, 
    t.sala, 
    t.professor_id, 
    p.nome, 
    p.slack_username, 
    t.horario_inicio, 
    t.categoria, 
    t.created_at
  ORDER BY t.horario_inicio, t.nome;
END;
$function$;