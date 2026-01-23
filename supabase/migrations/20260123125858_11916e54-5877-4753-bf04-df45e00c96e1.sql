-- Primeiro, converter qualquer registro com status legado
UPDATE alerta_evasao 
SET status = 'retido' 
WHERE status IN ('resolvido', 'em_andamento');

UPDATE alerta_evasao 
SET status = 'evadido' 
WHERE status = 'cancelado';

-- Remover o default temporariamente
ALTER TABLE alerta_evasao ALTER COLUMN status DROP DEFAULT;

-- Recriar o enum apenas com os 3 valores válidos
ALTER TYPE status_alerta RENAME TO status_alerta_old;

CREATE TYPE status_alerta AS ENUM ('pendente', 'retido', 'evadido');

ALTER TABLE alerta_evasao 
ALTER COLUMN status TYPE status_alerta 
USING status::text::status_alerta;

-- Restaurar o default
ALTER TABLE alerta_evasao ALTER COLUMN status SET DEFAULT 'pendente'::status_alerta;

DROP TYPE status_alerta_old;