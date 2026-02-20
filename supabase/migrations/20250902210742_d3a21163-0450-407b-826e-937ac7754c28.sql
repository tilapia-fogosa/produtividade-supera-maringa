-- Adicionar campo para controle de casos ocultos de retenção na tabela alunos
ALTER TABLE public.alunos 
ADD COLUMN oculto_retencoes boolean NOT NULL DEFAULT false;

-- Adicionar índice para otimizar consultas
CREATE INDEX idx_alunos_oculto_retencoes ON public.alunos(oculto_retencoes);