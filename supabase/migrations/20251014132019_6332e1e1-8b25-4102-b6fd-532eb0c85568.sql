-- Atualizar políticas RLS da tabela ah_recolhidas para permitir inserção sem autenticação
DROP POLICY IF EXISTS "Usuários autenticados podem inserir recolhimentos" ON public.ah_recolhidas;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar recolhimentos" ON public.ah_recolhidas;
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar recolhimentos" ON public.ah_recolhidas;

-- Criar novas políticas que permitem acesso público
CREATE POLICY "Acesso público para inserir recolhimentos"
ON public.ah_recolhidas
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Acesso público para atualizar recolhimentos"
ON public.ah_recolhidas
FOR UPDATE
TO public
USING (true);

CREATE POLICY "Acesso público para visualizar recolhimentos"
ON public.ah_recolhidas
FOR SELECT
TO public
USING (true);