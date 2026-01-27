-- Criar bucket para fotos de alunos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('alunos-fotos', 'alunos-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Política para leitura pública das fotos
CREATE POLICY "Fotos de alunos são públicas" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'alunos-fotos');

-- Política para upload por usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload de fotos" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'alunos-fotos');

-- Política para atualização por usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar fotos" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'alunos-fotos');

-- Política para deleção por usuários autenticados
CREATE POLICY "Usuários autenticados podem deletar fotos" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'alunos-fotos');