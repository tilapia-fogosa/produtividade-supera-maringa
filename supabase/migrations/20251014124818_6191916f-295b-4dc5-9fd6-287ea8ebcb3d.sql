-- Adicionar colunas necessárias à tabela ah_recolhidas
ALTER TABLE public.ah_recolhidas
ADD COLUMN IF NOT EXISTS pessoa_id uuid NOT NULL,
ADD COLUMN IF NOT EXISTS apostila text NOT NULL,
ADD COLUMN IF NOT EXISTS professor_id uuid,
ADD COLUMN IF NOT EXISTS responsavel_id uuid;

-- Remover a coluna responsavel antiga se existir (ela será substituída por responsavel_id)
ALTER TABLE public.ah_recolhidas
DROP COLUMN IF EXISTS responsavel;

-- Adicionar políticas RLS
ALTER TABLE public.ah_recolhidas ENABLE ROW LEVEL SECURITY;

-- Permitir usuários autenticados visualizar registros
CREATE POLICY "Usuários autenticados podem visualizar recolhimentos"
ON public.ah_recolhidas
FOR SELECT
TO authenticated
USING (true);

-- Permitir usuários autenticados inserir registros
CREATE POLICY "Usuários autenticados podem inserir recolhimentos"
ON public.ah_recolhidas
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir usuários autenticados atualizar registros
CREATE POLICY "Usuários autenticados podem atualizar recolhimentos"
ON public.ah_recolhidas
FOR UPDATE
TO authenticated
USING (true);