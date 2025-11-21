-- Adicionar coluna pdf_devolutiva_url na tabela funcionarios
ALTER TABLE funcionarios 
ADD COLUMN IF NOT EXISTS pdf_devolutiva_url TEXT;