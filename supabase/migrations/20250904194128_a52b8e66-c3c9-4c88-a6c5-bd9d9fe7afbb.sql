-- Povoar a coluna data_fim_correcao com os valores de created_at para registros existentes
UPDATE produtividade_ah 
SET data_fim_correcao = created_at 
WHERE data_fim_correcao IS NULL;