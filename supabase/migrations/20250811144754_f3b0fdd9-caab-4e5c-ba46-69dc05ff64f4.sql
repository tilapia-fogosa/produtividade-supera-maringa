-- Primeiro, verificar e limpar dados órfãos em alunos
-- Atualizar alunos órfãos para turma_id = NULL (ou deletar se preferir)
UPDATE public.alunos 
SET turma_id = NULL 
WHERE turma_id IS NOT NULL 
AND turma_id NOT IN (SELECT id FROM public.turmas);

-- Verificar e limpar dados órfãos em turmas
UPDATE public.turmas 
SET professor_id = NULL 
WHERE professor_id IS NOT NULL 
AND professor_id NOT IN (SELECT id FROM public.professores);

-- Agora adicionar as foreign key constraints
ALTER TABLE public.alunos 
ADD CONSTRAINT fk_alunos_turma_id 
FOREIGN KEY (turma_id) REFERENCES public.turmas(id);

ALTER TABLE public.turmas 
ADD CONSTRAINT fk_turmas_professor_id 
FOREIGN KEY (professor_id) REFERENCES public.professores(id);