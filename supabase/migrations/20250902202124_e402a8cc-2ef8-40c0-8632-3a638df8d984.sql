-- Criar tabela de retenções
CREATE TABLE public.retencoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL,
  responsavel_id UUID NOT NULL,
  responsavel_tipo TEXT NOT NULL CHECK (responsavel_tipo IN ('professor', 'funcionario')),
  responsavel_nome TEXT NOT NULL,
  data_retencao DATE NOT NULL,
  descritivo_responsavel TEXT NOT NULL,
  acoes_tomadas TEXT NOT NULL,
  unit_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true
);

-- Habilitar Row Level Security
ALTER TABLE public.retencoes ENABLE ROW LEVEL SECURITY;

-- Criar policies para retenções
CREATE POLICY "Users can view retencoes" 
ON public.retencoes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create retencoes" 
ON public.retencoes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update retencoes" 
ON public.retencoes 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete retencoes" 
ON public.retencoes 
FOR DELETE 
USING (true);

-- Criar trigger para update automático do updated_at
CREATE TRIGGER update_retencoes_updated_at
  BEFORE UPDATE ON public.retencoes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();

-- Criar índices para performance
CREATE INDEX idx_retencoes_aluno_id ON public.retencoes(aluno_id);
CREATE INDEX idx_retencoes_responsavel ON public.retencoes(responsavel_id);
CREATE INDEX idx_retencoes_unit_id ON public.retencoes(unit_id);
CREATE INDEX idx_retencoes_data ON public.retencoes(data_retencao);