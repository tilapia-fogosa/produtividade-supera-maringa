-- Adicionar foreign key constraint entre alunos.turma_id e turmas.id
ALTER TABLE public.alunos 
ADD CONSTRAINT fk_alunos_turma_id 
FOREIGN KEY (turma_id) REFERENCES public.turmas(id);

-- Adicionar foreign key constraint entre turmas.professor_id e professores.id
ALTER TABLE public.turmas 
ADD CONSTRAINT fk_turmas_professor_id 
FOREIGN KEY (professor_id) REFERENCES public.professores(id);