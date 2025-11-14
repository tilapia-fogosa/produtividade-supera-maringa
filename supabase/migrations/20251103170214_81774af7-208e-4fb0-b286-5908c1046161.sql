-- =====================================================
-- CRIAR VIEW UNIFICADA DE EVENTOS DO CALENDÁRIO
-- =====================================================
-- Esta view unifica turmas regulares e eventos de sala em uma única estrutura
-- para facilitar a renderização do calendário de aulas

CREATE OR REPLACE VIEW vw_calendario_eventos_unificados AS
-- Parte 1: Turmas regulares (aulas fixas semanais)
SELECT 
  t.id as evento_id,
  'turma'::text as tipo_evento,
  t.unit_id,
  t.dia_semana,
  t.horario_inicio,
  t.horario_fim,
  t.sala_id,
  s.nome as sala_nome,
  s.cor_calendario as sala_cor,
  t.nome as titulo,
  CONCAT(t.nome, ' - ', p.nome) as descricao,
  p.id as professor_id,
  p.nome as professor_nome,
  p.slack_username as professor_slack,
  TRIM(BOTH FROM SUBSTRING(t.nome FROM '- (.+)\)')) as categoria,
  NULL::date as data_especifica,
  t.created_at
FROM turmas t
JOIN salas s ON t.sala_id = s.id
JOIN professores p ON t.professor_id = p.id
WHERE t.active = true

UNION ALL

-- Parte 2: Eventos de sala (bloqueios/reservas específicas)
SELECT 
  e.id as evento_id,
  'evento_sala'::text as tipo_evento,
  e.unit_id,
  CASE EXTRACT(DOW FROM e.data)
    WHEN 1 THEN 'segunda'::dia_semana
    WHEN 2 THEN 'terca'::dia_semana
    WHEN 3 THEN 'quarta'::dia_semana
    WHEN 4 THEN 'quinta'::dia_semana
    WHEN 5 THEN 'sexta'::dia_semana
    WHEN 6 THEN 'sabado'::dia_semana
  END as dia_semana,
  e.horario_inicio,
  e.horario_fim,
  e.sala_id,
  s.nome as sala_nome,
  s.cor_calendario as sala_cor,
  e.titulo,
  e.descricao,
  NULL::uuid as professor_id,
  NULL::text as professor_nome,
  NULL::text as professor_slack,
  NULL::text as categoria,
  e.data as data_especifica,
  e.created_at
FROM eventos_sala e
JOIN salas s ON e.sala_id = s.id
WHERE e.active = true

ORDER BY horario_inicio, titulo;

-- =====================================================
-- CRIAR FUNÇÃO RPC PARA BUSCAR EVENTOS DO CALENDÁRIO
-- =====================================================
-- Retorna eventos unificados (turmas + bloqueios) com estatísticas
-- filtrados por período e opcionalmente por unidade

CREATE OR REPLACE FUNCTION get_calendario_eventos_unificados(
  p_data_inicio date,
  p_data_fim date,
  p_unit_id uuid DEFAULT NULL
)
RETURNS TABLE(
  evento_id uuid,
  tipo_evento text,
  unit_id uuid,
  dia_semana dia_semana,
  horario_inicio time,
  horario_fim time,
  sala_id uuid,
  sala_nome text,
  sala_cor text,
  titulo text,
  descricao text,
  professor_id uuid,
  professor_nome text,
  professor_slack text,
  categoria text,
  data_especifica date,
  total_alunos_ativos bigint,
  total_reposicoes bigint,
  total_aulas_experimentais bigint,
  total_faltas_futuras bigint,
  created_at timestamp with time zone
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH eventos_base AS (
    -- Selecionar eventos da view unificada
    SELECT * FROM vw_calendario_eventos_unificados
    WHERE 
      -- Filtrar por unidade se fornecido
      (p_unit_id IS NULL OR vw_calendario_eventos_unificados.unit_id = p_unit_id)
      -- Para eventos de sala, filtrar por data específica
      AND (data_especifica IS NULL OR 
           data_especifica BETWEEN p_data_inicio AND p_data_fim)
  ),
  turmas_com_stats AS (
    -- Calcular estatísticas apenas para turmas
    SELECT 
      eb.evento_id,
      COALESCE(COUNT(DISTINCT a.id) FILTER (WHERE a.active = true), 0) as alunos_ativos,
      COALESCE(COUNT(DISTINCT r.id), 0) as reposicoes,
      COALESCE(COUNT(DISTINCT ae.id), 0) as aulas_exp,
      COALESCE(COUNT(DISTINCT ff.id), 0) as faltas_fut
    FROM eventos_base eb
    LEFT JOIN alunos a ON eb.evento_id = a.turma_id AND eb.tipo_evento = 'turma'
    LEFT JOIN reposicoes r ON eb.evento_id = r.turma_id 
      AND r.data_reposicao BETWEEN p_data_inicio AND p_data_fim
      AND r.active = true
    LEFT JOIN aulas_experimentais ae ON eb.evento_id = ae.turma_id 
      AND ae.data_aula_experimental BETWEEN p_data_inicio AND p_data_fim
      AND ae.active = true
    LEFT JOIN faltas_antecipadas ff ON a.id = ff.aluno_id
      AND ff.data_falta BETWEEN p_data_inicio AND p_data_fim
      AND ff.active = true
    WHERE eb.tipo_evento = 'turma'
    GROUP BY eb.evento_id
  )
  SELECT 
    eb.evento_id,
    eb.tipo_evento,
    eb.unit_id,
    eb.dia_semana,
    eb.horario_inicio,
    eb.horario_fim,
    eb.sala_id,
    eb.sala_nome,
    eb.sala_cor,
    eb.titulo,
    eb.descricao,
    eb.professor_id,
    eb.professor_nome,
    eb.professor_slack,
    eb.categoria,
    eb.data_especifica,
    COALESCE(ts.alunos_ativos, 0) as total_alunos_ativos,
    COALESCE(ts.reposicoes, 0) as total_reposicoes,
    COALESCE(ts.aulas_exp, 0) as total_aulas_experimentais,
    COALESCE(ts.faltas_fut, 0) as total_faltas_futuras,
    eb.created_at
  FROM eventos_base eb
  LEFT JOIN turmas_com_stats ts ON eb.evento_id = ts.evento_id
  ORDER BY eb.horario_inicio, eb.titulo;
END;
$$;