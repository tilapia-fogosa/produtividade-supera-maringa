-- Habilitar RLS na tabela client_activities se necessário
ALTER TABLE public.client_activities ENABLE ROW LEVEL SECURITY;

-- Criar políticas básicas para permitir operações na tabela client_activities
CREATE POLICY "Permitir inserção de atividades" 
ON public.client_activities 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir leitura de atividades" 
ON public.client_activities 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir atualização de atividades" 
ON public.client_activities 
FOR UPDATE 
USING (true);

CREATE POLICY "Permitir exclusão de atividades" 
ON public.client_activities 
FOR DELETE 
USING (true);