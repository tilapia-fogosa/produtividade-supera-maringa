-- Primeiro, alterar a coluna turma_id para permitir NULL temporariamente
ALTER TABLE public.alunos ALTER COLUMN turma_id DROP NOT NULL;

-- Limpar dados órfãos em alunos
UPDATE public.alunos 
SET turma_id = NULL 
WHERE turma_id IS NOT NULL 
AND turma_id NOT IN (SELECT id FROM public.turmas);

-- Limpar dados órfãos em turmas  
UPDATE public.turmas 
SET professor_id = NULL 
WHERE professor_id IS NOT NULL 
AND professor_id NOT IN (SELECT id FROM public.professores);

-- Adicionar as foreign key constraints
ALTER TABLE public.alunos 
ADD CONSTRAINT fk_alunos_turma_id 
FOREIGN KEY (turma_id) REFERENCES public.turmas(id);

ALTER TABLE public.turmas 
ADD CONSTRAINT fk_turmas_professor_id 
FOREIGN KEY (professor_id) REFERENCES public.professores(id);