-- Povoar a coluna data_fim_correcao com os valores de created_at para registros existentes
UPDATE produtividade_ah 
SET data_fim_correção = created_at 
WHERE data_fim_correção IS NULL;