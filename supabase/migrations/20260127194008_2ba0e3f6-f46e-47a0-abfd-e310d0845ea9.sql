CREATE OR REPLACE FUNCTION get_professores_disponiveis_por_horario(
  p_data DATE,
  p_horario_inicio TIME,
  p_horario_fim TIME,
  p_unit_id UUID DEFAULT NULL
)
RETURNS TABLE (
  professor_id UUID,
  professor_nome TEXT,
  prioridade INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dia_semana TEXT;
  v_unit_id UUID;
BEGIN
  -- Determinar o dia da semana em portugues
  v_dia_semana := CASE EXTRACT(DOW FROM p_data)
    WHEN 0 THEN 'domingo'
    WHEN 1 THEN 'segunda'
    WHEN 2 THEN 'terca'
    WHEN 3 THEN 'quarta'
    WHEN 4 THEN 'quinta'
    WHEN 5 THEN 'sexta'
    WHEN 6 THEN 'sabado'
  END;
  
  -- Se unit_id nao foi passado, usar Maringa como padrao
  v_unit_id := COALESCE(p_unit_id, '0df79a04-444e-46ee-b218-59e4b1835f4a'::UUID);
  
  RETURN QUERY
  SELECT 
    p.id AS professor_id,
    p.nome AS professor_nome,
    COALESCE(p.prioridade, 999) AS prioridade
  FROM professores p
  WHERE p.status = true
    AND p.unit_id = v_unit_id
    -- Excluir professores com turmas regulares no mesmo dia/horario
    -- CORRECAO: Cast explicito para o tipo ENUM dia_semana
    AND NOT EXISTS (
      SELECT 1 FROM turmas t
      WHERE t.professor_id = p.id
        AND t.active = true
        AND t.dia_semana = v_dia_semana::dia_semana
        AND t.horario_inicio < p_horario_fim
        AND t.horario_fim > p_horario_inicio
    )
    -- Excluir professores com eventos pontuais na data especifica
    AND NOT EXISTS (
      SELECT 1 FROM eventos_professor ep
      WHERE ep.professor_id = p.id
        AND ep.recorrente = false
        AND ep.data = p_data
        AND ep.horario_inicio < p_horario_fim
        AND ep.horario_fim > p_horario_inicio
    )
    -- Excluir professores com eventos recorrentes semanais no mesmo dia
    AND NOT EXISTS (
      SELECT 1 FROM eventos_professor ep
      WHERE ep.professor_id = p.id
        AND ep.recorrente = true
        AND ep.tipo_recorrencia = 'semanal'
        AND ep.dia_semana = v_dia_semana
        AND (ep.data_inicio_recorrencia IS NULL OR ep.data_inicio_recorrencia <= p_data)
        AND (ep.data_fim_recorrencia IS NULL OR ep.data_fim_recorrencia >= p_data)
        AND ep.horario_inicio < p_horario_fim
        AND ep.horario_fim > p_horario_inicio
    )
  ORDER BY COALESCE(p.prioridade, 999) ASC, p.nome ASC;
END;
$$;