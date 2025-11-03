-- Corrige função RPC removendo coluna active inexistente de reposicoes
DROP FUNCTION IF EXISTS get_calendario_eventos_unificados(date, date, uuid);

CREATE OR REPLACE FUNCTION get_calendario_eventos_unificados(
  p_data_inicio date,
  p_data_fim date,
  p_unit_id uuid DEFAULT NULL
)
RETURNS TABLE (
  evento_id text,
  tipo_evento text,
  unit_id uuid,
  dia_semana text,
  horario_inicio text,
  horario_fim text,
  sala_id uuid,
  sala_nome text,
  sala_cor text,
  titulo text,
  descricao text,
  professor_id uuid,
  professor_nome text,
  professor_slack text,
  categoria text,
  data_especifica text,
  total_alunos_ativos bigint,
  total_reposicoes bigint,
  total_aulas_experimentais bigint,
  total_faltas_futuras bigint,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vce.evento_id,
    vce.tipo_evento,
    vce.unit_id,
    vce.dia_semana,
    vce.horario_inicio,
    vce.horario_fim,
    vce.sala_id,
    vce.sala_nome,
    vce.sala_cor,
    vce.titulo,
    vce.descricao,
    vce.professor_id,
    vce.professor_nome,
    vce.professor_slack,
    vce.categoria,
    vce.data_especifica,
    COALESCE(
      (SELECT COUNT(DISTINCT a.id)
       FROM alunos a
       WHERE a.turma_id::text = vce.evento_id
         AND a.active = true), 0
    )::bigint as total_alunos_ativos,
    COALESCE(
      (SELECT COUNT(*)
       FROM reposicoes r
       WHERE r.turma_id::text = vce.evento_id
         AND r.data_reposicao BETWEEN p_data_inicio AND p_data_fim), 0
    )::bigint as total_reposicoes,
    COALESCE(
      (SELECT COUNT(*)
       FROM aulas_experimentais ae
       WHERE ae.turma_id::text = vce.evento_id
         AND ae.data_aula_experimental BETWEEN p_data_inicio AND p_data_fim
         AND ae.active = true), 0
    )::bigint as total_aulas_experimentais,
    COALESCE(
      (SELECT COUNT(*)
       FROM faltas_antecipadas fa
       INNER JOIN alunos a ON fa.aluno_id = a.id
       WHERE a.turma_id::text = vce.evento_id
         AND fa.data_falta BETWEEN p_data_inicio AND p_data_fim
         AND fa.active = true), 0
    )::bigint as total_faltas_futuras,
    vce.created_at
  FROM vw_calendario_eventos_unificados vce
  WHERE (p_unit_id IS NULL OR vce.unit_id = p_unit_id)
  ORDER BY 
    CASE vce.dia_semana
      WHEN 'Segunda' THEN 1
      WHEN 'Terça' THEN 2
      WHEN 'Quarta' THEN 3
      WHEN 'Quinta' THEN 4
      WHEN 'Sexta' THEN 5
      WHEN 'Sábado' THEN 6
      WHEN 'Domingo' THEN 7
    END,
    vce.horario_inicio;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;