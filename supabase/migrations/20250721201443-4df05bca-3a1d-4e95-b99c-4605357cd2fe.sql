
-- Criar view do calendário de turmas com processamento de dados
CREATE VIEW calendario_turmas_view AS
SELECT 
  t.id as turma_id,
  t.unit_id,
  t.nome as nome_completo,
  t.dia_semana,
  t.sala,
  t.professor_id,
  p.nome as professor_nome,
  p.slack_username as professor_slack,
  -- Extrair horário (ex: "14:01" de "2ª (14:01 - 60+S)")
  SUBSTRING(t.nome FROM '\(([0-9]{2}:[0-9]{2})') as horario_inicio,
  -- Extrair categoria após o "-" (ex: "60+S" de "2ª (14:01 - 60+S)")
  TRIM(SUBSTRING(t.nome FROM '- (.+)\)')) as categoria,
  -- Contar alunos ativos na turma
  COUNT(a.id) FILTER (WHERE a.active = true) as total_alunos_ativos,
  t.created_at
FROM turmas t
LEFT JOIN professores p ON t.professor_id = p.id
LEFT JOIN alunos a ON t.id = a.turma_id AND a.active = true
GROUP BY t.id, t.unit_id, t.nome, t.dia_semana, t.sala, t.professor_id, p.nome, p.slack_username, t.created_at
ORDER BY t.dia_semana, horario_inicio;
