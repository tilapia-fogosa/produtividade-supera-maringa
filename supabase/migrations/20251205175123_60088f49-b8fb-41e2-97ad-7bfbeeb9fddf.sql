-- Criar tabela de tarefas pessoais
CREATE TABLE public.tarefas_pessoais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_vencimento DATE NOT NULL,
  concluida BOOLEAN DEFAULT false,
  prioridade TEXT DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tarefas_pessoais ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - usuário só vê suas próprias tarefas
CREATE POLICY "Users can view their own tasks" 
ON public.tarefas_pessoais 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" 
ON public.tarefas_pessoais 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" 
ON public.tarefas_pessoais 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" 
ON public.tarefas_pessoais 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_tarefas_pessoais_updated_at
  BEFORE UPDATE ON public.tarefas_pessoais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();