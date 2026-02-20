-- Criar bucket para devolutivas (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'devolutivas',
  'devolutivas',
  true,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir leitura pública
CREATE POLICY "Permitir leitura pública de devolutivas"
ON storage.objects FOR SELECT
USING (bucket_id = 'devolutivas');

-- Política para permitir upload autenticado
CREATE POLICY "Permitir upload autenticado de devolutivas"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'devolutivas' 
  AND auth.role() = 'authenticated'
);