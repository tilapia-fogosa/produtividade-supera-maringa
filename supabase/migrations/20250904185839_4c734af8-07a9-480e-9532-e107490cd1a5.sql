-- Adicionar campo data_fim_correcao na tabela produtividade_ah
ALTER TABLE produtividade_ah 
ADD COLUMN data_fim_correcao TIMESTAMP WITH TIME ZONE;