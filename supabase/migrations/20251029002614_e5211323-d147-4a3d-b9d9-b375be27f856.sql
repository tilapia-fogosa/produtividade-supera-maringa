-- Tabela para eventos vinculados a professores
CREATE TABLE eventos_professor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
  tipo_evento TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  
  -- Para eventos pontuais
  data DATE,
  
  -- Horários
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  
  -- Para eventos recorrentes
  recorrente BOOLEAN DEFAULT false,
  tipo_recorrencia TEXT,
  dia_semana TEXT,
  dia_mes INTEGER,
  data_inicio_recorrencia DATE,
  data_fim_recorrencia DATE,
  
  -- Controle
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_eventos_professor_professor ON eventos_professor(professor_id);
CREATE INDEX idx_eventos_professor_data ON eventos_professor(data);
CREATE INDEX idx_eventos_professor_unit ON eventos_professor(unit_id);
CREATE INDEX idx_eventos_professor_active ON eventos_professor(active);

-- Trigger para updated_at
CREATE TRIGGER update_eventos_professor_updated_at
  BEFORE UPDATE ON eventos_professor
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE eventos_professor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eventos professor visíveis para todos autenticados"
  ON eventos_professor FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas autenticados podem criar eventos professor"
  ON eventos_professor FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Apenas autenticados podem atualizar eventos professor"
  ON eventos_professor FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Apenas autenticados podem deletar eventos professor"
  ON eventos_professor FOR DELETE
  TO authenticated
  USING (true);

-- Função RPC para buscar agenda de professores
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
  -- Aulas regulares (turmas)
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
  
  -- Eventos pontuais do professor
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
    AND (p_unit_id IS NULL OR ep.unit_id = p_unit_id)
  
  UNION ALL
  
  -- Eventos recorrentes semanais do professor
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
    AND (p_unit_id IS NULL OR ep.unit_id = p_unit_id)
  
  ORDER BY professor_nome, dia_semana, horario_inicio;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;