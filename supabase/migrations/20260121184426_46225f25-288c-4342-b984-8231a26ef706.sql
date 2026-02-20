-- Drop existing table (cascade removes dependencies like policies)
DROP TABLE IF EXISTS public.alerta_evasao CASCADE;

-- Recreate the table
CREATE TABLE public.alerta_evasao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL REFERENCES public.alunos(id),
  data_alerta TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  origem_alerta public.origem_alerta NOT NULL,
  descritivo TEXT,
  responsavel TEXT,
  data_retencao TIMESTAMP WITH TIME ZONE,
  status public.status_alerta NOT NULL DEFAULT 'pendente',
  kanban_status TEXT NOT NULL DEFAULT 'todo',
  funcionario_registro_id UUID REFERENCES public.funcionarios(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alerta_evasao ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view all alerts"
ON public.alerta_evasao
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert alerts"
ON public.alerta_evasao
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update alerts"
ON public.alerta_evasao
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete alerts"
ON public.alerta_evasao
FOR DELETE
TO authenticated
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_alerta_evasao_updated_at
BEFORE UPDATE ON public.alerta_evasao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';