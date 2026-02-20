-- Fix total_funcionarios_ativos count in vw_calendario_eventos_unificados
-- Now includes both alunos with is_funcionario=true AND funcionarios table

DROP VIEW IF EXISTS vw_calendario_eventos_unificados;

CREATE VIEW vw_calendario_eventos_unificados AS
-- Turmas regulares
SELECT
  t.id::text AS evento_id,
  'turma'::text AS tipo_evento,
  t.unit_id,
  t.dia_semana::text AS dia_semana,
  t.horario_inicio::text AS horario_inicio,
  t.horario_fim::text AS horario_fim,
  t.sala_id,
  s.nome AS sala_nome,
  s.cor_calendario AS sala_cor,
  t.nome AS titulo,
  '' AS descricao,
  t.professor_id,
  p.nome AS professor_nome,
  p.slack_username AS professor_slack,
  t.perfil AS perfil,
  NULL::date AS data_especifica,
  COALESCE(
    (SELECT COUNT(DISTINCT a.id)
     FROM alunos a
     WHERE a.turma_id = t.id
       AND a.active = true
       AND a.is_funcionario = false), 0
  )::integer AS total_alunos_ativos,
  (
    COALESCE(
      (SELECT COUNT(DISTINCT a.id)
       FROM alunos a
       WHERE a.turma_id = t.id
         AND a.active = true
         AND a.is_funcionario = true), 0
    ) +
    COALESCE(
      (SELECT COUNT(DISTINCT f.id)
       FROM funcionarios f
       WHERE f.turma_id = t.id
         AND f.active = true), 0
    )
  )::integer AS total_funcionarios_ativos,
  0::integer AS total_reposicoes,
  0::integer AS total_aulas_experimentais,
  0::integer AS total_faltas_futuras,
  t.created_at
FROM turmas t
  LEFT JOIN professores p ON p.id = t.professor_id
  LEFT JOIN salas s ON s.id = t.sala_id
WHERE t.active = true

UNION ALL

-- Eventos de sala (bloqueios)
SELECT
  es.id::text AS evento_id,
  'evento_sala'::text AS tipo_evento,
  es.unit_id,
  CASE EXTRACT(DOW FROM es.data)
    WHEN 1 THEN 'segunda'
    WHEN 2 THEN 'terca'
    WHEN 3 THEN 'quarta'
    WHEN 4 THEN 'quinta'
    WHEN 5 THEN 'sexta'
    WHEN 6 THEN 'sabado'
    ELSE 'domingo'
  END AS dia_semana,
  TO_CHAR(es.horario_inicio, 'HH24:MI') AS horario_inicio,
  TO_CHAR(es.horario_fim, 'HH24:MI') AS horario_fim,
  es.sala_id,
  s.nome AS sala_nome,
  s.cor_calendario AS sala_cor,
  es.titulo,
  es.descricao,
  NULL::uuid AS professor_id,
  NULL::text AS professor_nome,
  NULL::text AS professor_slack,
  NULL::text AS perfil,
  es.data AS data_especifica,
  0::integer AS total_alunos_ativos,
  0::integer AS total_funcionarios_ativos,
  0::integer AS total_reposicoes,
  0::integer AS total_aulas_experimentais,
  0::integer AS total_faltas_futuras,
  es.created_at
FROM eventos_sala es
  LEFT JOIN salas s ON s.id = es.sala_id
WHERE es.active = true;