-- Remover índice
DROP INDEX IF EXISTS idx_eventos_professor_unit;

-- Remover foreign key constraint
ALTER TABLE eventos_professor 
DROP CONSTRAINT IF EXISTS eventos_professor_unit_id_fkey;

-- Remover coluna unit_id
ALTER TABLE eventos_professor 
DROP COLUMN IF EXISTS unit_id;

-- Atualizar função RPC para remover filtro de unit_id dos eventos
CREATE OR REPLACE FUNCTION get_agenda_professores_semana(
  p_data_inicio DATE,
  p_data_fim DATE,
  p_unit_id UUID DEFAULT NULL
) RETURNS TABLE (
  professor_id UUID,
  professor_nome TEXT,
  dia_semana TEXT,
  horario_inicio TIME,
  horario_fim TIME,
  tipo TEXT,
  titulo TEXT,
  turma_nome TEXT,
  sala TEXT,
  evento_id UUID,
  turma_id UUID,
  data DATE
) AS $$
BEGIN
  RETURN QUERY
  -- Aulas regulares (turmas) - mantém filtro de unit_id
  SELECT 
    t.professor_id,
    p.nome as professor_nome,
    t.dia_semana::TEXT,
    t.horario_inicio,
    t.horario_fim,
    'aula'::TEXT as tipo,
    t.nome as titulo,
    t.nome as turma_nome,
    s.nome as sala,
    NULL::UUID as evento_id,
    t.id as turma_id,
    NULL::DATE as data
  FROM turmas t
  INNER JOIN professores p ON t.professor_id = p.id
  LEFT JOIN salas s ON t.sala_id = s.id
  WHERE t.active = true
    AND (p_unit_id IS NULL OR t.unit_id = p_unit_id)
    AND t.horario_inicio IS NOT NULL
    AND t.horario_fim IS NOT NULL
  
  UNION ALL
  
  -- Eventos pontuais do professor (GLOBAL - sem filtro de unit_id)
  SELECT 
    ep.professor_id,
    p.nome as professor_nome,
    CASE EXTRACT(DOW FROM ep.data)
      WHEN 0 THEN 'domingo'
      WHEN 1 THEN 'segunda'
      WHEN 2 THEN 'terca'
      WHEN 3 THEN 'quarta'
      WHEN 4 THEN 'quinta'
      WHEN 5 THEN 'sexta'
      WHEN 6 THEN 'sabado'
    END::TEXT as dia_semana,
    ep.horario_inicio,
    ep.horario_fim,
    'evento'::TEXT as tipo,
    ep.titulo,
    NULL::TEXT as turma_nome,
    NULL::TEXT as sala,
    ep.id as evento_id,
    NULL::UUID as turma_id,
    ep.data
  FROM eventos_professor ep
  INNER JOIN professores p ON ep.professor_id = p.id
  WHERE ep.active = true
    AND ep.recorrente = false
    AND ep.data BETWEEN p_data_inicio AND p_data_fim
  
  UNION ALL
  
  -- Eventos recorrentes semanais (GLOBAL - sem filtro de unit_id)
  SELECT 
    ep.professor_id,
    p.nome as professor_nome,
    ep.dia_semana::TEXT,
    ep.horario_inicio,
    ep.horario_fim,
    'evento'::TEXT as tipo,
    ep.titulo,
    NULL::TEXT as turma_nome,
    NULL::TEXT as sala,
    ep.id as evento_id,
    NULL::UUID as turma_id,
    NULL::DATE as data
  FROM eventos_professor ep
  INNER JOIN professores p ON ep.professor_id = p.id
  WHERE ep.active = true
    AND ep.recorrente = true
    AND ep.tipo_recorrencia = 'semanal'
    AND (ep.data_inicio_recorrencia IS NULL OR p_data_inicio >= ep.data_inicio_recorrencia)
    AND (ep.data_fim_recorrencia IS NULL OR p_data_fim <= ep.data_fim_recorrencia)
  
  ORDER BY professor_nome, dia_semana, horario_inicio;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;