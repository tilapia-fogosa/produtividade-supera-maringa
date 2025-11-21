-- Adicionar coluna valorizado na tabela evento_participantes
ALTER TABLE evento_participantes
ADD COLUMN IF NOT EXISTS valorizado BOOLEAN DEFAULT false;

-- Adicionar coluna compareceu na tabela evento_participantes  
ALTER TABLE evento_participantes
ADD COLUMN IF NOT EXISTS compareceu BOOLEAN DEFAULT false;

-- Adicionar coluna valorizado na tabela convidados_eventos
ALTER TABLE convidados_eventos
ADD COLUMN IF NOT EXISTS valorizado BOOLEAN DEFAULT false;

-- Adicionar coluna compareceu na tabela convidados_eventos
ALTER TABLE convidados_eventos
ADD COLUMN IF NOT EXISTS compareceu BOOLEAN DEFAULT false;