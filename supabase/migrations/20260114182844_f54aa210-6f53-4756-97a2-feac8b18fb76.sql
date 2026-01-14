-- Criar bucket para capas de eventos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('eventos-capas', 'eventos-capas', true)
ON CONFLICT (id) DO NOTHING;

-- Política de leitura pública
CREATE POLICY "Capas de eventos são públicas" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'eventos-capas');

-- Política de upload para usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload de capas" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'eventos-capas' AND auth.role() = 'authenticated');

-- Política de update para usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar capas" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'eventos-capas' AND auth.role() = 'authenticated');

-- Política de delete para usuários autenticados
CREATE POLICY "Usuários autenticados podem deletar capas" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'eventos-capas' AND auth.role() = 'authenticated');