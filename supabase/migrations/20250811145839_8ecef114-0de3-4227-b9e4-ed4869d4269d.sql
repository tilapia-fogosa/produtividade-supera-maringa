-- Remover a foreign key duplicada que está causando conflito
ALTER TABLE public.turmas DROP CONSTRAINT IF EXISTS turmas_professor_id_fkey;