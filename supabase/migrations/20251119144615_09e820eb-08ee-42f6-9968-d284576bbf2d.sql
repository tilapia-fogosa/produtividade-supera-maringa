-- Adicionar campo pago na tabela evento_participantes
ALTER TABLE evento_participantes 
ADD COLUMN IF NOT EXISTS pago boolean DEFAULT false;

-- Adicionar campo pago na tabela convidados_eventos
ALTER TABLE convidados_eventos 
ADD COLUMN IF NOT EXISTS pago boolean DEFAULT false;