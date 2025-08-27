-- Criar tabela para controle de troféus de 1000 dias
CREATE TABLE public.trofeus_1000_dias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL,
  trofeu_pedido BOOLEAN NOT NULL DEFAULT false,
  trofeu_confeccionado BOOLEAN NOT NULL DEFAULT false,
  trofeu_entregue BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trofeus_1000_dias ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Acesso público para visualizar troféus"
ON public.trofeus_1000_dias
FOR SELECT
USING (true);

CREATE POLICY "Acesso público para inserir troféus"
ON public.trofeus_1000_dias
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Acesso público para atualizar troféus"
ON public.trofeus_1000_dias
FOR UPDATE
USING (true);

CREATE POLICY "Acesso público para deletar troféus"
ON public.trofeus_1000_dias
FOR DELETE
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_trofeus_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_trofeus_1000_dias_updated_at
BEFORE UPDATE ON public.trofeus_1000_dias
FOR EACH ROW
EXECUTE FUNCTION public.update_trofeus_updated_at();