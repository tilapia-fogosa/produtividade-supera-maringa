-- Adicionar a coluna faltas_consecutivas na tabela funcionarios para manter consistência
ALTER TABLE funcionarios 
ADD COLUMN faltas_consecutivas smallint NOT NULL DEFAULT 0;