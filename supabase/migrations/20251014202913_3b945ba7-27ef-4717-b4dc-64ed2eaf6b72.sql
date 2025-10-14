-- Adicionar campos de entrega na tabela ah_recolhidas
ALTER TABLE ah_recolhidas
ADD COLUMN data_entrega_real TIMESTAMP WITH TIME ZONE,
ADD COLUMN responsavel_entrega_id UUID REFERENCES profiles(id),
ADD COLUMN responsavel_entrega_nome TEXT;

-- Comentários para documentação
COMMENT ON COLUMN ah_recolhidas.data_entrega_real IS 'Data real da entrega da apostila corrigida ao aluno/funcionário';
COMMENT ON COLUMN ah_recolhidas.responsavel_entrega_id IS 'ID do usuário que registrou a entrega';
COMMENT ON COLUMN ah_recolhidas.responsavel_entrega_nome IS 'Nome denormalizado do responsável pela entrega para facilitar consultas';

-- Índice para melhorar performance de consultas por data de entrega
CREATE INDEX idx_ah_recolhidas_data_entrega_real ON ah_recolhidas(data_entrega_real) WHERE data_entrega_real IS NOT NULL;