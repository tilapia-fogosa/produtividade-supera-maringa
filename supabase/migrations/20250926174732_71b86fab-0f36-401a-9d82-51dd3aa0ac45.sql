-- Adicionar campo para "não tem tamanho" e observações na tabela camisetas
ALTER TABLE camisetas ADD COLUMN IF NOT EXISTS nao_tem_tamanho boolean DEFAULT false;
ALTER TABLE camisetas ADD COLUMN IF NOT EXISTS observacoes text;