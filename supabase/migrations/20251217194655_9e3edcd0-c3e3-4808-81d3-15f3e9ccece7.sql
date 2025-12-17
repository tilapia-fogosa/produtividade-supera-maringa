-- Políticas RLS para o bucket wpp_pedagogico
-- Permitir que usuários autenticados acessem as mídias do WhatsApp

-- Política para permitir visualização de mídia do WhatsApp para usuários autenticados
CREATE POLICY "Usuários autenticados podem ver mídia do WhatsApp"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'wpp_pedagogico');

-- Política para permitir upload de mídia do WhatsApp para usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload de mídia do WhatsApp"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'wpp_pedagogico');

-- Política para permitir atualização de mídia do WhatsApp para usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar mídia do WhatsApp"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'wpp_pedagogico');

-- Política para permitir deleção de mídia do WhatsApp para usuários autenticados
CREATE POLICY "Usuários autenticados podem deletar mídia do WhatsApp"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'wpp_pedagogico');