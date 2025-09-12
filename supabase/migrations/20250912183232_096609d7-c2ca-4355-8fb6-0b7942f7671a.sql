-- Adicionar coluna foto_url na tabela alunos
ALTER TABLE public.alunos 
ADD COLUMN foto_url text;

-- Adicionar coluna foto_url na tabela funcionarios
ALTER TABLE public.funcionarios 
ADD COLUMN foto_url text;

-- Criar bucket para fotos de pessoas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fotos-pessoas',
  'fotos-pessoas',
  true,
  5242880, -- 5MB em bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Política para permitir visualização pública das fotos
CREATE POLICY "Fotos são publicamente visíveis"
ON storage.objects
FOR SELECT
USING (bucket_id = 'fotos-pessoas');

-- Política para permitir upload de fotos por usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload de fotos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'fotos-pessoas' 
  AND auth.uid() IS NOT NULL
);

-- Política para permitir atualização de fotos por usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar fotos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'fotos-pessoas' 
  AND auth.uid() IS NOT NULL
);

-- Política para permitir deleção de fotos por usuários autenticados
CREATE POLICY "Usuários autenticados podem deletar fotos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'fotos-pessoas' 
  AND auth.uid() IS NOT NULL
);