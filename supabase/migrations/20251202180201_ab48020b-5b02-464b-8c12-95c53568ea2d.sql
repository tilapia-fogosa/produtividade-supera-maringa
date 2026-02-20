-- Criar tabela apostilas_ah
CREATE TABLE public.apostilas_ah (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  total_paginas INTEGER NOT NULL,
  exercicios_por_pagina INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.apostilas_ah ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso público (mesmas da tabela apostilas)
CREATE POLICY "Permitir leitura pública de apostilas_ah" 
ON public.apostilas_ah 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserção de apostilas_ah" 
ON public.apostilas_ah 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir atualização de apostilas_ah" 
ON public.apostilas_ah 
FOR UPDATE 
USING (true);

CREATE POLICY "Permitir exclusão de apostilas_ah" 
ON public.apostilas_ah 
FOR DELETE 
USING (true);

-- Migrar apostilas que contêm (AH) para a nova tabela
INSERT INTO public.apostilas_ah (nome, total_paginas, exercicios_por_pagina, created_at)
SELECT nome, total_paginas, exercicios_por_pagina, created_at
FROM public.apostilas
WHERE nome ILIKE '%(AH)%';

-- Remover as apostilas migradas da tabela original
DELETE FROM public.apostilas WHERE nome ILIKE '%(AH)%';