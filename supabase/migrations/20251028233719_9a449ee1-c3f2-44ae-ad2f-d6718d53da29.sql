-- Atualizar função para considerar horários de funcionamento
CREATE OR REPLACE FUNCTION get_horarios_disponiveis_salas(
  p_data DATE,
  p_unit_id UUID DEFAULT NULL
) RETURNS TABLE (
  horario_inicio TIME,
  horario_fim TIME,
  total_salas_livres INTEGER,
  salas_livres_ids UUID[]
) AS $$
DECLARE
  v_dia_semana dia_semana;
  v_horario_inicio TIME;
  v_horario_fim TIME;
  v_aberto BOOLEAN;
BEGIN
  -- Determinar dia da semana
  v_dia_semana := CASE EXTRACT(DOW FROM p_data)
    WHEN 0 THEN 'domingo'
    WHEN 1 THEN 'segunda'
    WHEN 2 THEN 'terca'
    WHEN 3 THEN 'quarta'
    WHEN 4 THEN 'quinta'
    WHEN 5 THEN 'sexta'
    WHEN 6 THEN 'sabado'
  END::dia_semana;
  
  -- Definir horários de funcionamento
  CASE v_dia_semana
    WHEN 'segunda' THEN
      v_horario_inicio := '08:00'::TIME;
      v_horario_fim := '18:00'::TIME;
      v_aberto := TRUE;
    WHEN 'terca' THEN
      v_horario_inicio := '08:00'::TIME;
      v_horario_fim := '20:30'::TIME;
      v_aberto := TRUE;
    WHEN 'quarta' THEN
      v_horario_inicio := '08:00'::TIME;
      v_horario_fim := '20:30'::TIME;
      v_aberto := TRUE;
    WHEN 'quinta' THEN
      v_horario_inicio := '08:00'::TIME;
      v_horario_fim := '18:00'::TIME;
      v_aberto := TRUE;
    WHEN 'sexta' THEN
      v_horario_inicio := '08:00'::TIME;
      v_horario_fim := '18:00'::TIME;
      v_aberto := TRUE;
    WHEN 'sabado' THEN
      v_horario_inicio := '08:00'::TIME;
      v_horario_fim := '12:00'::TIME;
      v_aberto := TRUE;
    WHEN 'domingo' THEN
      v_aberto := FALSE;
  END CASE;
  
  -- Se não está aberto, retornar vazio
  IF NOT v_aberto THEN
    RETURN;
  END IF;
  
  -- Buscar horários com disponibilidade
  RETURN QUERY
  WITH horarios_ocupados AS (
    -- Horários ocupados por turmas
    SELECT 
      t.horario_inicio,
      t.horario_fim,
      t.sala_id
    FROM turmas t
    WHERE t.dia_semana = v_dia_semana
      AND (p_unit_id IS NULL OR t.unit_id = p_unit_id)
      AND t.active = true
      AND t.sala_id IS NOT NULL
      AND t.horario_inicio IS NOT NULL
      AND t.horario_fim IS NOT NULL
    
    UNION ALL
    
    -- Horários ocupados por eventos
    SELECT 
      e.horario_inicio,
      e.horario_fim,
      e.sala_id
    FROM eventos_sala e
    WHERE e.data = p_data
      AND (p_unit_id IS NULL OR e.unit_id = p_unit_id)
      AND e.active = true
  ),
  todas_salas AS (
    SELECT id FROM salas 
    WHERE (p_unit_id IS NULL OR unit_id = p_unit_id) 
      AND active = true
  ),
  slots_tempo AS (
    -- Gerar slots de 30 min dentro do horário de funcionamento
    SELECT 
      (v_horario_inicio + (interval '30 minutes' * s)) as inicio,
      (v_horario_inicio + (interval '30 minutes' * (s + 1))) as fim
    FROM generate_series(
      0, 
      EXTRACT(EPOCH FROM (v_horario_fim - v_horario_inicio))::INTEGER / 1800 - 1
    ) s
  )
  SELECT 
    st.inicio as horario_inicio,
    st.fim as horario_fim,
    (COUNT(ts.id) - COUNT(ho.sala_id))::INTEGER as total_salas_livres,
    ARRAY_AGG(DISTINCT ts.id) FILTER (WHERE ho.sala_id IS NULL) as salas_livres_ids
  FROM slots_tempo st
  CROSS JOIN todas_salas ts
  LEFT JOIN horarios_ocupados ho ON (
    ho.sala_id = ts.id
    AND st.inicio < ho.horario_fim
    AND st.fim > ho.horario_inicio
  )
  WHERE st.fim <= v_horario_fim
  GROUP BY st.inicio, st.fim
  HAVING (COUNT(ts.id) - COUNT(ho.sala_id))::INTEGER > 0
  ORDER BY st.inicio;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;