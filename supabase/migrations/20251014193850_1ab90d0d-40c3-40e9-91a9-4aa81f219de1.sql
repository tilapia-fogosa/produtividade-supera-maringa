-- Adicionar coluna para vincular correções de AH com apostilas recolhidas
ALTER TABLE produtividade_ah 
ADD COLUMN ah_recolhida_id INTEGER REFERENCES ah_recolhidas(id);

-- Criar índice para melhorar performance nas consultas
CREATE INDEX idx_produtividade_ah_recolhida_id ON produtividade_ah(ah_recolhida_id);

-- Comentário explicativo
COMMENT ON COLUMN produtividade_ah.ah_recolhida_id IS 'Referência à apostila recolhida que foi corrigida. Uma apostila pode ter múltiplas correções.';