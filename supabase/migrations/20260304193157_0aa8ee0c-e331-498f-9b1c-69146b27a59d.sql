DROP INDEX IF EXISTS idx_alunos_client_id;
ALTER TABLE public.alunos DROP CONSTRAINT IF EXISTS alunos_client_id_fkey;
ALTER TABLE public.alunos DROP COLUMN IF EXISTS client_id;