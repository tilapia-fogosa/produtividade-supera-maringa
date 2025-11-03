-- Corrigir a função verificar_conflito_sala para fazer cast correto do tipo dia_semana
CREATE OR REPLACE FUNCTION verificar_conflito_sala(
  p_sala_id UUID,
  p_data DATE,
  p_horario_inicio TIME,
  p_horario_fim TIME,
  p_evento_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_tem_conflito BOOLEAN;
BEGIN
  -- Verificar conflito com turmas regulares
  SELECT EXISTS (
    SELECT 1 FROM turmas
    WHERE sala_id = p_sala_id
      AND active = true
      AND dia_semana = (
        SELECT CASE EXTRACT(DOW FROM p_data)
          WHEN 0 THEN 'domingo'
          WHEN 1 THEN 'segunda'
          WHEN 2 THEN 'terca'
          WHEN 3 THEN 'quarta'
          WHEN 4 THEN 'quinta'
          WHEN 5 THEN 'sexta'
          WHEN 6 THEN 'sabado'
        END::dia_semana
      )
      AND horario_inicio IS NOT NULL
      AND horario_fim IS NOT NULL
      AND (
        (horario_inicio < p_horario_fim AND horario_fim > p_horario_inicio)
      )
  ) INTO v_tem_conflito;
  
  IF v_tem_conflito THEN
    RETURN true;
  END IF;
  
  -- Verificar conflito com eventos de sala
  SELECT EXISTS (
    SELECT 1 FROM eventos_sala
    WHERE sala_id = p_sala_id
      AND active = true
      AND data = p_data
      AND (id != p_evento_id OR p_evento_id IS NULL)
      AND (
        (horario_inicio < p_horario_fim AND horario_fim > p_horario_inicio)
      )
  ) INTO v_tem_conflito;
  
  RETURN v_tem_conflito;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;