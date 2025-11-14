-- Criar tabela para reposições de aula
CREATE TABLE public.reposicoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL,
  turma_id UUID NOT NULL,
  data_reposicao DATE NOT NULL,
  responsavel_id UUID NOT NULL,
  responsavel_tipo TEXT NOT NULL CHECK (responsavel_tipo IN ('professor', 'funcionario')),
  observacoes TEXT,
  unit_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT,
  
  -- Foreign keys
  FOREIGN KEY (aluno_id) REFERENCES public.alunos(id),
  FOREIGN KEY (turma_id) REFERENCES public.turmas(id)
);

-- Enable RLS
ALTER TABLE public.reposicoes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Permitir leitura pública de reposições"
  ON public.reposicoes
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção pública de reposições"
  ON public.reposicoes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização pública de reposições"
  ON public.reposicoes
  FOR UPDATE
  USING (true);

-- Create index for better performance
CREATE INDEX idx_reposicoes_turma_data ON public.reposicoes(turma_id, data_reposicao);
CREATE INDEX idx_reposicoes_aluno ON public.reposicoes(aluno_id);