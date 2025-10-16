-- Remover as colunas adicionadas anteriormente na tabela alunos
ALTER TABLE alunos 
DROP COLUMN IF EXISTS ah_ignorar_ate,
DROP COLUMN IF EXISTS ah_ignorar_motivo,
DROP COLUMN IF EXISTS ah_ignorar_responsavel;

-- Criar tabela para controle de períodos de ignorar coletas AH
CREATE TABLE IF NOT EXISTS ah_ignorar_coleta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id uuid NOT NULL,
  pessoa_tipo text NOT NULL CHECK (pessoa_tipo IN ('aluno', 'funcionario')),
  data_inicio timestamp with time zone NOT NULL DEFAULT now(),
  data_fim timestamp with time zone NOT NULL,
  dias integer NOT NULL CHECK (dias > 0),
  motivo text NOT NULL,
  responsavel text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true
);

-- Adicionar comentários
COMMENT ON TABLE ah_ignorar_coleta IS 'Registros de períodos em que pessoas devem ser ignoradas da lista de coletas AH';
COMMENT ON COLUMN ah_ignorar_coleta.pessoa_id IS 'ID da pessoa (aluno ou funcionário)';
COMMENT ON COLUMN ah_ignorar_coleta.pessoa_tipo IS 'Tipo da pessoa: aluno ou funcionario';
COMMENT ON COLUMN ah_ignorar_coleta.data_inicio IS 'Data de início do período de ignorar';
COMMENT ON COLUMN ah_ignorar_coleta.data_fim IS 'Data de término do período de ignorar';
COMMENT ON COLUMN ah_ignorar_coleta.dias IS 'Quantidade de dias do período';
COMMENT ON COLUMN ah_ignorar_coleta.motivo IS 'Motivo pelo qual a pessoa está sendo ignorada';
COMMENT ON COLUMN ah_ignorar_coleta.responsavel IS 'Nome do responsável que registrou o período';
COMMENT ON COLUMN ah_ignorar_coleta.active IS 'Se o registro está ativo';

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_ah_ignorar_coleta_pessoa ON ah_ignorar_coleta(pessoa_id, pessoa_tipo);
CREATE INDEX IF NOT EXISTS idx_ah_ignorar_coleta_data_fim ON ah_ignorar_coleta(data_fim) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_ah_ignorar_coleta_active ON ah_ignorar_coleta(active);

-- Habilitar RLS
ALTER TABLE ah_ignorar_coleta ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - Permitir acesso público (ajustar conforme necessidade)
CREATE POLICY "Permitir leitura pública de ignorar coleta"
  ON ah_ignorar_coleta
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção pública de ignorar coleta"
  ON ah_ignorar_coleta
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização pública de ignorar coleta"
  ON ah_ignorar_coleta
  FOR UPDATE
  USING (true);

CREATE POLICY "Permitir exclusão pública de ignorar coleta"
  ON ah_ignorar_coleta
  FOR DELETE
  USING (true);