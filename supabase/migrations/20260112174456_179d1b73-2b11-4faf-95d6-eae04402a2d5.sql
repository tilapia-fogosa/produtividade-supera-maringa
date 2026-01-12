-- Tabela de tags da galeria
CREATE TABLE public.galeria_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL DEFAULT '#6366f1',
  unit_id UUID NOT NULL REFERENCES public.units(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de fotos da galeria
CREATE TABLE public.galeria_fotos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  turma_id UUID REFERENCES public.turmas(id),
  aluno_id UUID REFERENCES public.alunos(id),
  unit_id UUID NOT NULL REFERENCES public.units(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela de vínculo entre fotos e tags (N:N)
CREATE TABLE public.galeria_fotos_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  foto_id UUID NOT NULL REFERENCES public.galeria_fotos(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.galeria_tags(id) ON DELETE CASCADE,
  UNIQUE(foto_id, tag_id)
);

-- Índices para performance
CREATE INDEX idx_galeria_fotos_unit_id ON public.galeria_fotos(unit_id);
CREATE INDEX idx_galeria_fotos_turma_id ON public.galeria_fotos(turma_id);
CREATE INDEX idx_galeria_fotos_aluno_id ON public.galeria_fotos(aluno_id);
CREATE INDEX idx_galeria_fotos_created_at ON public.galeria_fotos(created_at);
CREATE INDEX idx_galeria_tags_unit_id ON public.galeria_tags(unit_id);
CREATE INDEX idx_galeria_fotos_tags_foto_id ON public.galeria_fotos_tags(foto_id);
CREATE INDEX idx_galeria_fotos_tags_tag_id ON public.galeria_fotos_tags(tag_id);

-- Habilitar RLS
ALTER TABLE public.galeria_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galeria_fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galeria_fotos_tags ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para galeria_tags
CREATE POLICY "Usuários podem ver tags da sua unidade"
ON public.galeria_tags
FOR SELECT
USING (true);

CREATE POLICY "Usuários podem criar tags"
ON public.galeria_tags
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar tags da sua unidade"
ON public.galeria_tags
FOR UPDATE
USING (true);

CREATE POLICY "Usuários podem deletar tags da sua unidade"
ON public.galeria_tags
FOR DELETE
USING (true);

-- Políticas RLS para galeria_fotos
CREATE POLICY "Usuários podem ver fotos"
ON public.galeria_fotos
FOR SELECT
USING (true);

CREATE POLICY "Usuários podem criar fotos"
ON public.galeria_fotos
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar fotos"
ON public.galeria_fotos
FOR UPDATE
USING (true);

CREATE POLICY "Usuários podem deletar fotos"
ON public.galeria_fotos
FOR DELETE
USING (true);

-- Políticas RLS para galeria_fotos_tags
CREATE POLICY "Usuários podem ver vínculos foto-tag"
ON public.galeria_fotos_tags
FOR SELECT
USING (true);

CREATE POLICY "Usuários podem criar vínculos foto-tag"
ON public.galeria_fotos_tags
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Usuários podem deletar vínculos foto-tag"
ON public.galeria_fotos_tags
FOR DELETE
USING (true);

-- Criar bucket de storage para galeria
INSERT INTO storage.buckets (id, name, public)
VALUES ('galeria-fotos', 'galeria-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para galeria-fotos
CREATE POLICY "Fotos da galeria são públicas"
ON storage.objects
FOR SELECT
USING (bucket_id = 'galeria-fotos');

CREATE POLICY "Usuários autenticados podem fazer upload na galeria"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'galeria-fotos' AND auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar fotos da galeria"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'galeria-fotos' AND auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar fotos da galeria"
ON storage.objects
FOR DELETE
USING (bucket_id = 'galeria-fotos' AND auth.role() = 'authenticated');