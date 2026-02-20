-- Adicionar coluna visivel na tabela galeria_fotos
ALTER TABLE public.galeria_fotos 
ADD COLUMN visivel BOOLEAN NOT NULL DEFAULT true;

-- Comentário para documentação
COMMENT ON COLUMN public.galeria_fotos.visivel IS 'Indica se a foto será exibida no visualizador de imagens';