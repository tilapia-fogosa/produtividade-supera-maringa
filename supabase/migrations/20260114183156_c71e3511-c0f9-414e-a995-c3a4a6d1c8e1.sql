-- Criar tabela de avisos
CREATE TABLE public.avisos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  imagem_url TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  unit_id UUID NOT NULL REFERENCES public.units(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários autenticados podem ver avisos"
ON public.avisos FOR SELECT
USING (true);

CREATE POLICY "Usuários autenticados podem criar avisos"
ON public.avisos FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar avisos"
ON public.avisos FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar avisos"
ON public.avisos FOR DELETE
USING (auth.role() = 'authenticated');

-- Trigger para updated_at
CREATE TRIGGER update_avisos_updated_at
BEFORE UPDATE ON public.avisos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket para imagens de avisos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avisos-imagens', 'avisos-imagens', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "Imagens de avisos são públicas" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avisos-imagens');

CREATE POLICY "Usuários autenticados podem fazer upload de avisos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avisos-imagens' AND auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar imagens de avisos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'avisos-imagens' AND auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar imagens de avisos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'avisos-imagens' AND auth.role() = 'authenticated');