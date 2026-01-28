-- Adicionar coluna client_id na tabela alunos para vincular com clients
ALTER TABLE public.alunos 
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id);

-- Índice para busca rápida de alunos sem vínculo
CREATE INDEX IF NOT EXISTS idx_alunos_client_id ON public.alunos(client_id);

-- Comentário para documentação
COMMENT ON COLUMN public.alunos.client_id IS 'Vínculo com o client (venda) associado a este aluno';