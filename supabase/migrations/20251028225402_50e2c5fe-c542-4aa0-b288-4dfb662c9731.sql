-- Atualizar função RPC para aceitar unit_id opcional
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
    -- Gerar slots de 30 min das 6h às 21h
    SELECT 
      (time '06:00:00' + (interval '30 minutes' * s)) as inicio,
      (time '06:00:00' + (interval '30 minutes' * (s + 1))) as fim
    FROM generate_series(0, 29) s
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
  GROUP BY st.inicio, st.fim
  HAVING (COUNT(ts.id) - COUNT(ho.sala_id))::INTEGER > 0
  ORDER BY st.inicio;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;