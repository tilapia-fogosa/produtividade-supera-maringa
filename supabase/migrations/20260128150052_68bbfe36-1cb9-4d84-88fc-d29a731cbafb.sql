-- Tabela para registrar aniversários já parabenizados
CREATE TABLE public.aniversarios_concluidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  ano INT NOT NULL,
  data_conclusao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  funcionario_registro_id UUID REFERENCES public.funcionarios(id),
  responsavel_nome TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(aluno_id, ano)
);

-- Enable RLS
ALTER TABLE public.aniversarios_concluidos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Qualquer usuário autenticado pode ver aniversários concluídos"
ON public.aniversarios_concluidos
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Qualquer usuário autenticado pode registrar aniversário concluído"
ON public.aniversarios_concluidos
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Qualquer usuário autenticado pode atualizar aniversário concluído"
ON public.aniversarios_concluidos
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Índice para performance
CREATE INDEX idx_aniversarios_concluidos_aluno_ano ON public.aniversarios_concluidos(aluno_id, ano);