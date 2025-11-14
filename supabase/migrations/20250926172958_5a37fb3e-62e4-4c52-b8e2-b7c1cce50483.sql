-- Criar tabela para controle de camisetas dos alunos
CREATE TABLE public.camisetas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id uuid NOT NULL,
  camiseta_entregue boolean NOT NULL DEFAULT false,
  data_entrega timestamp with time zone,
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(aluno_id)
);

-- Enable Row Level Security
ALTER TABLE public.camisetas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view camisetas" 
ON public.camisetas 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert camisetas" 
ON public.camisetas 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update camisetas" 
ON public.camisetas 
FOR UPDATE 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_camisetas_updated_at
BEFORE UPDATE ON public.camisetas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();