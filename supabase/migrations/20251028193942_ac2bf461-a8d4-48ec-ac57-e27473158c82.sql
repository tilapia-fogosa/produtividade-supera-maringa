-- =====================================================
-- FASE 1: CRIAR ESTRUTURA BASE DE SALAS E HORÁRIOS
-- =====================================================

-- 1.1 - Criar tabela salas
CREATE TABLE IF NOT EXISTS salas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  capacidade INTEGER,
  recursos TEXT[],
  cor_calendario TEXT,
  unit_id UUID NOT NULL REFERENCES units(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salas_unit ON salas(unit_id);
CREATE INDEX IF NOT EXISTS idx_salas_active ON salas(active);

-- 1.2 - Atualizar tabela turmas - Adicionar horários e referência à sala
ALTER TABLE turmas 
ADD COLUMN IF NOT EXISTS horario_inicio TIME,
ADD COLUMN IF NOT EXISTS horario_fim TIME,
ADD COLUMN IF NOT EXISTS sala_id UUID REFERENCES salas(id);

CREATE INDEX IF NOT EXISTS idx_turmas_sala ON turmas(sala_id);
CREATE INDEX IF NOT EXISTS idx_turmas_horario ON turmas(dia_semana, horario_inicio);

-- =====================================================
-- FASE 2: CRIAR SISTEMA DE DISPONIBILIDADE DE PROFESSORES
-- =====================================================

CREATE TABLE IF NOT EXISTS disponibilidade_professores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
  dia_semana TEXT NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  observacoes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT check_horario_valido CHECK (horario_fim > horario_inicio)
);

CREATE INDEX IF NOT EXISTS idx_disponibilidade_professor ON disponibilidade_professores(professor_id);
CREATE INDEX IF NOT EXISTS idx_disponibilidade_dia ON disponibilidade_professores(dia_semana);

-- =====================================================
-- FASE 3: CRIAR SISTEMA DE EVENTOS DE SALA
-- =====================================================

-- 3.1 - Criar ENUMs
DO $$ BEGIN
  CREATE TYPE tipo_evento_sala AS ENUM (
    'manutencao',
    'reuniao',
    'evento_especial',
    'reserva_administrativa',
    'bloqueio_temporario',
    'workshop',
    'treinamento',
    'outro'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE tipo_recorrencia AS ENUM (
    'semanal',
    'quinzenal',
    'mensal'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3.2 - Criar tabela eventos_sala
CREATE TABLE IF NOT EXISTS eventos_sala (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id UUID NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  tipo_evento tipo_evento_sala NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  
  data DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  
  responsavel_id UUID NOT NULL,
  responsavel_tipo TEXT NOT NULL,
  
  turma_id UUID REFERENCES turmas(id) ON DELETE SET NULL,
  
  recorrente BOOLEAN DEFAULT false,
  tipo_recorrencia tipo_recorrencia,
  dia_semana TEXT,
  dia_mes INTEGER,
  data_inicio_recorrencia DATE,
  data_fim_recorrencia DATE,
  
  unit_id UUID NOT NULL REFERENCES units(id),
  active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT check_horario_evento_valido CHECK (horario_fim > horario_inicio),
  CONSTRAINT check_recorrencia_semanal CHECK (
    (recorrente = false) OR 
    (tipo_recorrencia = 'semanal' AND dia_semana IS NOT NULL) OR
    (tipo_recorrencia = 'quinzenal' AND dia_semana IS NOT NULL) OR
    (tipo_recorrencia = 'mensal' AND dia_mes IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_eventos_sala ON eventos_sala(sala_id);
CREATE INDEX IF NOT EXISTS idx_eventos_data ON eventos_sala(data);
CREATE INDEX IF NOT EXISTS idx_eventos_recorrente ON eventos_sala(recorrente);
CREATE INDEX IF NOT EXISTS idx_eventos_unit ON eventos_sala(unit_id);

-- =====================================================
-- FASE 4: CRIAR VIEWS E FUNÇÕES AUXILIARES
-- =====================================================

-- 4.1 - View: Visualizar ocupação de salas (turmas regulares)
CREATE OR REPLACE VIEW vw_ocupacao_salas_turmas AS
SELECT 
  s.id as sala_id,
  s.nome as sala_nome,
  s.unit_id,
  t.id as turma_id,
  t.nome as turma_nome,
  t.dia_semana,
  t.horario_inicio,
  t.horario_fim,
  p.nome as professor_nome,
  p.id as professor_id,
  COUNT(a.id) as total_alunos
FROM salas s
LEFT JOIN turmas t ON s.id = t.sala_id AND t.active = true
LEFT JOIN professores p ON t.professor_id = p.id
LEFT JOIN alunos a ON t.id = a.turma_id AND a.active = true
WHERE s.active = true
GROUP BY s.id, s.nome, s.unit_id, t.id, t.nome, t.dia_semana, 
         t.horario_inicio, t.horario_fim, p.nome, p.id;

-- 4.2 - View: Visualizar todos os eventos de sala
CREATE OR REPLACE VIEW vw_eventos_sala_expandidos AS
SELECT 
  e.id,
  e.sala_id,
  s.nome as sala_nome,
  e.tipo_evento,
  e.titulo,
  e.descricao,
  e.data,
  e.horario_inicio,
  e.horario_fim,
  e.responsavel_id,
  e.responsavel_tipo,
  e.turma_id,
  e.recorrente,
  e.unit_id,
  e.created_at
FROM eventos_sala e
JOIN salas s ON e.sala_id = s.id
WHERE e.active = true
ORDER BY e.data, e.horario_inicio;

-- 4.3 - Função: Verificar conflitos de horário em salas
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
        END
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
$$ LANGUAGE plpgsql;

-- =====================================================
-- FASE 5: MIGRAÇÃO DE DADOS EXISTENTES
-- =====================================================

-- 5.1 - Criar salas padrão baseadas nos valores únicos de turmas.sala
INSERT INTO salas (nome, capacidade, unit_id, active)
SELECT DISTINCT 
  COALESCE(t.sala, 'Sala não definida') as nome,
  20 as capacidade,
  t.unit_id,
  true
FROM turmas t
WHERE t.sala IS NOT NULL AND t.sala != ''
ON CONFLICT DO NOTHING;

-- 5.2 - Atualizar turmas com sala_id correspondente
UPDATE turmas t
SET sala_id = s.id
FROM salas s
WHERE t.sala = s.nome 
  AND t.unit_id = s.unit_id
  AND t.sala IS NOT NULL
  AND t.sala_id IS NULL;

-- =====================================================
-- FASE 6: FUNÇÕES RPC PARA O FRONTEND
-- =====================================================

-- 6.1 - RPC: Obter agenda completa de uma sala
CREATE OR REPLACE FUNCTION get_agenda_sala(
  p_sala_id UUID,
  p_data_inicio DATE,
  p_data_fim DATE
) RETURNS TABLE (
  tipo TEXT,
  titulo TEXT,
  data DATE,
  dia_semana TEXT,
  horario_inicio TIME,
  horario_fim TIME,
  responsavel TEXT,
  turma_id UUID,
  evento_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'turma'::TEXT as tipo,
    t.nome as titulo,
    d.data::DATE,
    t.dia_semana::TEXT,
    t.horario_inicio,
    t.horario_fim,
    p.nome as responsavel,
    t.id as turma_id,
    NULL::UUID as evento_id
  FROM turmas t
  JOIN professores p ON t.professor_id = p.id
  CROSS JOIN generate_series(p_data_inicio, p_data_fim, '1 day'::interval) d(data)
  WHERE t.sala_id = p_sala_id
    AND t.active = true
    AND t.horario_inicio IS NOT NULL
    AND t.dia_semana = (
      SELECT CASE EXTRACT(DOW FROM d.data)
        WHEN 0 THEN 'domingo'
        WHEN 1 THEN 'segunda'
        WHEN 2 THEN 'terca'
        WHEN 3 THEN 'quarta'
        WHEN 4 THEN 'quinta'
        WHEN 5 THEN 'sexta'
        WHEN 6 THEN 'sabado'
      END
    )
  
  UNION ALL
  
  SELECT 
    'evento'::TEXT as tipo,
    e.titulo,
    e.data,
    NULL::TEXT as dia_semana,
    e.horario_inicio,
    e.horario_fim,
    CASE 
      WHEN e.responsavel_tipo = 'professor' THEN prof.nome
      WHEN e.responsavel_tipo = 'funcionario' THEN func.nome
      ELSE 'Administrador'
    END as responsavel,
    e.turma_id,
    e.id as evento_id
  FROM eventos_sala e
  LEFT JOIN professores prof ON e.responsavel_id = prof.id AND e.responsavel_tipo = 'professor'
  LEFT JOIN funcionarios func ON e.responsavel_id = func.id AND e.responsavel_tipo = 'funcionario'
  WHERE e.sala_id = p_sala_id
    AND e.active = true
    AND e.data BETWEEN p_data_inicio AND p_data_fim
    AND e.recorrente = false
  
  ORDER BY data, horario_inicio;
END;
$$ LANGUAGE plpgsql;

-- 6.2 - RPC: Obter disponibilidade de um professor
CREATE OR REPLACE FUNCTION get_disponibilidade_professor(
  p_professor_id UUID,
  p_data_inicio DATE,
  p_data_fim DATE
) RETURNS TABLE (
  dia_semana TEXT,
  horario_inicio TIME,
  horario_fim TIME,
  ocupado BOOLEAN,
  turma_nome TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.dia_semana,
    d.horario_inicio,
    d.horario_fim,
    CASE WHEN t.id IS NOT NULL THEN true ELSE false END as ocupado,
    t.nome as turma_nome
  FROM disponibilidade_professores d
  LEFT JOIN turmas t ON t.professor_id = p_professor_id 
    AND t.dia_semana = d.dia_semana
    AND t.active = true
    AND t.horario_inicio < d.horario_fim 
    AND t.horario_fim > d.horario_inicio
  WHERE d.professor_id = p_professor_id
    AND d.active = true
  ORDER BY 
    CASE d.dia_semana
      WHEN 'segunda' THEN 1
      WHEN 'terca' THEN 2
      WHEN 'quarta' THEN 3
      WHEN 'quinta' THEN 4
      WHEN 'sexta' THEN 5
      WHEN 'sabado' THEN 6
      WHEN 'domingo' THEN 7
    END,
    d.horario_inicio;
END;
$$ LANGUAGE plpgsql;