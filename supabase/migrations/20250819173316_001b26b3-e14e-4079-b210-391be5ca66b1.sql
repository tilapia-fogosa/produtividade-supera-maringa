-- Corrigir a view calendario_turmas_view para evitar produto cartesiano
DROP VIEW IF EXISTS calendario_turmas_view;

CREATE VIEW calendario_turmas_view AS
SELECT 
  t.id AS turma_id,
  t.unit_id,
  t.nome AS nome_completo,
  t.dia_semana,
  t.sala,
  t.professor_id,
  p.nome AS professor_nome,
  p.slack_username AS professor_slack,
  SUBSTRING(t.nome FROM '\(([0-9]{2}:[0-9]{2})') AS horario_inicio,
  TRIM(BOTH FROM SUBSTRING(t.nome FROM '- (.+)\)')) AS categoria,
  (
    COALESCE((SELECT COUNT(*) FROM alunos a WHERE a.turma_id = t.id AND a.active = true), 0) + 
    COALESCE((SELECT COUNT(*) FROM funcionarios f WHERE f.turma_id = t.id AND f.active = true), 0)
  ) AS total_alunos_ativos,
  t.created_at
FROM turmas t
  LEFT JOIN professores p ON t.professor_id = p.id
ORDER BY 
  t.dia_semana, 
  SUBSTRING(t.nome FROM '\(([0-9]{2}:[0-9]{2})');