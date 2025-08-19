-- Criar tabela para faltas antecipadas
CREATE TABLE public.faltas_antecipadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL,
  turma_id UUID NOT NULL,
  data_falta DATE NOT NULL,
  responsavel_aviso_id UUID NOT NULL,
  responsavel_aviso_tipo TEXT NOT NULL CHECK (responsavel_aviso_tipo IN ('professor', 'funcionario')),
  responsavel_aviso_nome TEXT NOT NULL,
  observacoes TEXT,
  unit_id UUID NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true
);

-- Ativar RLS
ALTER TABLE public.faltas_antecipadas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can create faltas antecipadas"
ON public.faltas_antecipadas
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view faltas antecipadas"
ON public.faltas_antecipadas
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update faltas antecipadas"
ON public.faltas_antecipadas
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Users can delete faltas antecipadas"
ON public.faltas_antecipadas
FOR DELETE
TO authenticated
USING (true);

-- Índices para performance
CREATE INDEX idx_faltas_antecipadas_aluno_id ON public.faltas_antecipadas(aluno_id);
CREATE INDEX idx_faltas_antecipadas_turma_id ON public.faltas_antecipadas(turma_id);
CREATE INDEX idx_faltas_antecipadas_data_falta ON public.faltas_antecipadas(data_falta);
CREATE INDEX idx_faltas_antecipadas_unit_id ON public.faltas_antecipadas(unit_id);