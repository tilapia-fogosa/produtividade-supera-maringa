-- Remover políticas existentes para fotos-pessoas
DROP POLICY IF EXISTS "Fotos são publicamente visíveis" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de fotos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar fotos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar fotos" ON storage.objects;

-- Política para permitir visualização pública das fotos
CREATE POLICY "Fotos são publicamente visíveis"
ON storage.objects
FOR SELECT
USING (bucket_id = 'fotos-pessoas');

-- Política para permitir upload público de fotos
CREATE POLICY "Qualquer um pode fazer upload de fotos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'fotos-pessoas');

-- Política para permitir atualização pública de fotos
CREATE POLICY "Qualquer um pode atualizar fotos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'fotos-pessoas');

-- Política para permitir deleção pública de fotos
CREATE POLICY "Qualquer um pode deletar fotos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'fotos-pessoas');