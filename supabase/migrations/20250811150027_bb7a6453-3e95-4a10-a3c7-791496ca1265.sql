-- Verificar e remover todas as foreign keys duplicadas entre turmas e professores
-- Primeiro, listar todas as foreign keys da tabela turmas
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint 
WHERE conrelid = 'public.turmas'::regclass 
AND contype = 'f';

-- Remover TODAS as foreign keys existentes entre turmas e professores
ALTER TABLE public.turmas DROP CONSTRAINT IF EXISTS fk_turmas_professor_id;
ALTER TABLE public.turmas DROP CONSTRAINT IF EXISTS turmas_professor_id_fkey;

-- Recriar apenas uma foreign key limpa
ALTER TABLE public.turmas 
ADD CONSTRAINT turmas_professor_fkey 
FOREIGN KEY (professor_id) REFERENCES public.professores(id);