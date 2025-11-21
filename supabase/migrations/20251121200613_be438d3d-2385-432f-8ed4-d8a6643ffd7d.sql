-- Criar bucket para PDFs de devolutivas
INSERT INTO storage.buckets (id, name, public)
VALUES ('devolutivas-pdf', 'devolutivas-pdf', true)
ON CONFLICT (id) DO NOTHING;

-- Adicionar coluna para armazenar URL do PDF na tabela alunos
ALTER TABLE alunos 
ADD COLUMN IF NOT EXISTS pdf_devolutiva_url TEXT;

-- Criar políticas RLS para o bucket de devolutivas PDF
-- Permitir leitura pública
CREATE POLICY "PDFs de devolutivas são acessíveis publicamente"
ON storage.objects FOR SELECT
USING (bucket_id = 'devolutivas-pdf');

-- Permitir upload para usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload de PDFs de devolutivas"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'devolutivas-pdf' 
  AND auth.role() = 'authenticated'
);

-- Permitir atualização para usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar PDFs de devolutivas"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'devolutivas-pdf'
  AND auth.role() = 'authenticated'
);

-- Permitir deleção para usuários autenticados
CREATE POLICY "Usuários autenticados podem deletar PDFs de devolutivas"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'devolutivas-pdf'
  AND auth.role() = 'authenticated'
);