-- Adicionar novos valores ao enum tipo_atividade_evasao
ALTER TYPE tipo_atividade_evasao ADD VALUE IF NOT EXISTS 'lancar_multa_sgs';
ALTER TYPE tipo_atividade_evasao ADD VALUE IF NOT EXISTS 'envio_agradecimento_nps';
ALTER TYPE tipo_atividade_evasao ADD VALUE IF NOT EXISTS 'digitalizar_rescisao';

-- Adicionar coluna para armazenar URL da rescisão digitalizada no alerta
ALTER TABLE alerta_evasao ADD COLUMN IF NOT EXISTS rescisao_digitalizada_url TEXT;

-- Criar bucket para armazenar rescisões digitalizadas (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('rescisoes-digitalizadas', 'rescisoes-digitalizadas', false)
ON CONFLICT (id) DO NOTHING;

-- Criar policy para permitir upload autenticado
CREATE POLICY "Usuários autenticados podem fazer upload de rescisões" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'rescisoes-digitalizadas');

-- Criar policy para permitir leitura por usuários autenticados
CREATE POLICY "Usuários autenticados podem ler rescisões" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'rescisoes-digitalizadas');

-- Criar policy para permitir update por usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar rescisões" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'rescisoes-digitalizadas');

-- Criar policy para permitir delete por usuários autenticados
CREATE POLICY "Usuários autenticados podem deletar rescisões" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'rescisoes-digitalizadas');