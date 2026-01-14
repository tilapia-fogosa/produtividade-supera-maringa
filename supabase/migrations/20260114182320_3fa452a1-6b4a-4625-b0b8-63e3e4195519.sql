-- Adicionar campos para capa/convite e visibilidade pública no visualizador
ALTER TABLE public.eventos 
ADD COLUMN IF NOT EXISTS imagem_url TEXT,
ADD COLUMN IF NOT EXISTS publico BOOLEAN DEFAULT false;

-- Comentários para documentação
COMMENT ON COLUMN public.eventos.imagem_url IS 'URL da imagem de capa/convite do evento';
COMMENT ON COLUMN public.eventos.publico IS 'Se true, o evento aparece no visualizador público';