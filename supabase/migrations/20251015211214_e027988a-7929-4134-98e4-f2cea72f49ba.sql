-- Adicionar novas colunas para controlar o início da correção
ALTER TABLE ah_recolhidas 
ADD COLUMN IF NOT EXISTS correcao_iniciada BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS responsavel_correcao_id UUID,
ADD COLUMN IF NOT EXISTS responsavel_correcao_nome TEXT,
ADD COLUMN IF NOT EXISTS responsavel_correcao_tipo TEXT,
ADD COLUMN IF NOT EXISTS data_inicio_correcao TIMESTAMP WITH TIME ZONE;

-- Comentários para documentação
COMMENT ON COLUMN ah_recolhidas.correcao_iniciada IS 'Indica se a correção foi iniciada';
COMMENT ON COLUMN ah_recolhidas.responsavel_correcao_id IS 'ID do responsável pela correção (professor ou estagiário)';
COMMENT ON COLUMN ah_recolhidas.responsavel_correcao_nome IS 'Nome do responsável pela correção';
COMMENT ON COLUMN ah_recolhidas.responsavel_correcao_tipo IS 'Tipo do responsável: Professor ou Estagiário';
COMMENT ON COLUMN ah_recolhidas.data_inicio_correcao IS 'Data e hora de início da correção';