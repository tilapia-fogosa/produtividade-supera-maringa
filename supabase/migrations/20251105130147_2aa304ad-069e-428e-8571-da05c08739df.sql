-- Dropar a função existente primeiro
DROP FUNCTION IF EXISTS get_calendario_turmas_semana_com_reposicoes(date, date);

-- Recriar a view para separar contagem de alunos e funcionários
DROP VIEW IF EXISTS calendario_turmas_view CASCADE;

CREATE OR REPLACE VIEW calendario_turmas_view AS
SELECT 
  t.id AS turma_id,
  t.unit_id,
  t.nome AS nome_completo,
  t.dia_semana,
  t.sala,
  t.professor_id,
  p.nome AS professor_nome,
  p.slack_username AS professor_slack,
  substring(t.nome FROM '\(([0-9]{2}:[0-9]{2})') AS horario_inicio,
  TRIM(BOTH FROM substring(t.nome FROM '- (.+)\)')) AS categoria,
  COALESCE((
    SELECT count(*)
    FROM alunos a
    WHERE a.turma_id = t.id AND a.active = true
  ), 0) AS total_alunos_ativos,
  COALESCE((
    SELECT count(*)
    FROM funcionarios f
    WHERE f.turma_id = t.id AND f.active = true
  ), 0) AS total_funcionarios_ativos,
  t.created_at
FROM turmas t
LEFT JOIN professores p ON t.professor_id = p.id
ORDER BY t.dia_semana, substring(t.nome FROM '\(([0-9]{2}:[0-9]{2})');

-- Recriar a função RPC para incluir total_funcionarios_ativos
CREATE OR REPLACE FUNCTION get_calendario_turmas_semana_com_reposicoes(
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
  total_funcionarios_ativos bigint,
  total_reposicoes bigint,
  total_aulas_experimentais bigint,
  total_faltas_futuras bigint,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH reposicoes_count AS (
    SELECT 
      r.turma_id,
      COUNT(r.id) as count_reposicoes
    FROM reposicoes r
    WHERE r.data_reposicao BETWEEN p_data_inicio AND p_data_fim
    GROUP BY r.turma_id
  ),
  aulas_experimentais_count AS (
    SELECT 
      ae.turma_id,
      COUNT(ae.id) as count_aulas_experimentais
    FROM aulas_experimentais ae
    WHERE ae.data_aula_experimental BETWEEN p_data_inicio AND p_data_fim
      AND ae.active = true
    GROUP BY ae.turma_id
  ),
  faltas_futuras_count AS (
    SELECT 
      a.turma_id,
      COUNT(fa.id) as count_faltas_futuras
    FROM faltas_antecipadas fa
    JOIN alunos a ON fa.aluno_id = a.id
    WHERE fa.data_falta BETWEEN p_data_inicio AND p_data_fim
      AND fa.active = true
      AND a.active = true
    GROUP BY a.turma_id
  )
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
    ctv.total_funcionarios_ativos,
    COALESCE(rc.count_reposicoes, 0) as total_reposicoes,
    COALESCE(aec.count_aulas_experimentais, 0) as total_aulas_experimentais,
    COALESCE(ffc.count_faltas_futuras, 0) as total_faltas_futuras,
    ctv.created_at
  FROM calendario_turmas_view ctv
  LEFT JOIN reposicoes_count rc ON rc.turma_id = ctv.turma_id
  LEFT JOIN aulas_experimentais_count aec ON aec.turma_id = ctv.turma_id
  LEFT JOIN faltas_futuras_count ffc ON ffc.turma_id = ctv.turma_id
  ORDER BY ctv.horario_inicio, ctv.nome_completo;
END;
$$;