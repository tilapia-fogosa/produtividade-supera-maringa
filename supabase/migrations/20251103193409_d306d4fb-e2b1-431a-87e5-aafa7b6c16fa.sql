-- Adicionar coluna duracao_minutos na tabela eventos_professor
ALTER TABLE eventos_professor 
ADD COLUMN IF NOT EXISTS duracao_minutos integer;

-- Atualizar view para calcular dia_semana dos eventos pontuais
DROP VIEW IF EXISTS vw_calendario_eventos_unificados;

CREATE OR REPLACE VIEW vw_calendario_eventos_unificados AS
-- Turmas recorrentes
SELECT
  t.id::text as evento_id,
  'turma'::text as tipo_evento,
  t.unit_id,
  t.dia_semana::text,
  COALESCE(t.horario_inicio::text, '00:00') as horario_inicio,
  COALESCE(t.horario_fim::text, '00:00') as horario_fim,
  COALESCE(s.id, '00000000-0000-0000-0000-000000000000'::uuid) as sala_id,
  COALESCE(s.nome, 'Sem sala') as sala_nome,
  COALESCE(s.cor_calendario, '#94a3b8') as sala_cor,
  t.nome as titulo,
  ''::text as descricao,
  p.id as professor_id,
  p.nome as professor_nome,
  p.slack_username as professor_slack,
  ''::text as categoria,
  NULL::text as data_especifica,
  t.created_at
FROM turmas t
LEFT JOIN salas s ON t.sala = s.nome AND t.unit_id = s.unit_id
INNER JOIN professores p ON t.professor_id = p.id
WHERE t.active = true

UNION ALL

-- Eventos de sala pontuais (com data específica)
SELECT
  es.id::text as evento_id,
  'evento_sala'::text as tipo_evento,
  es.unit_id,
  CASE EXTRACT(DOW FROM es.data::date)
    WHEN 1 THEN 'segunda'
    WHEN 2 THEN 'terca'
    WHEN 3 THEN 'quarta'
    WHEN 4 THEN 'quinta'
    WHEN 5 THEN 'sexta'
    WHEN 6 THEN 'sabado'
    ELSE NULL
  END::text as dia_semana,
  COALESCE(es.horario_inicio::text, '00:00') as horario_inicio,
  COALESCE(es.horario_fim::text, '00:00') as horario_fim,
  s.id as sala_id,
  s.nome as sala_nome,
  s.cor_calendario as sala_cor,
  es.titulo,
  COALESCE(es.descricao, '')::text as descricao,
  CASE
    WHEN es.responsavel_tipo = 'professor' THEN es.responsavel_id
    ELSE NULL
  END as professor_id,
  CASE
    WHEN es.responsavel_tipo = 'professor' THEN p.nome
    ELSE NULL
  END as professor_nome,
  CASE
    WHEN es.responsavel_tipo = 'professor' THEN p.slack_username
    ELSE NULL
  END as professor_slack,
  ''::text as categoria,
  es.data::text as data_especifica,
  es.created_at
FROM eventos_sala es
INNER JOIN salas s ON es.sala_id = s.id
LEFT JOIN professores p ON es.responsavel_id = p.id AND es.responsavel_tipo = 'professor'
WHERE es.active = true AND es.data IS NOT NULL;