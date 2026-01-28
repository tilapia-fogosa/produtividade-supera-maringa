-- Criar tabela de pendências de botom
CREATE TABLE pendencias_botom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  apostila_nova TEXT NOT NULL,
  apostila_anterior TEXT,
  professor_responsavel_id UUID REFERENCES professores(id),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'entregue')),
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_entrega TIMESTAMPTZ,
  funcionario_registro_id UUID
);

-- Índices para performance
CREATE INDEX idx_pendencias_botom_aluno ON pendencias_botom(aluno_id);
CREATE INDEX idx_pendencias_botom_professor ON pendencias_botom(professor_responsavel_id);
CREATE INDEX idx_pendencias_botom_status ON pendencias_botom(status);

-- RLS
ALTER TABLE pendencias_botom ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados podem ver pendencias"
  ON pendencias_botom FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados podem inserir pendencias"
  ON pendencias_botom FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados podem atualizar pendencias"
  ON pendencias_botom FOR UPDATE TO authenticated USING (true);