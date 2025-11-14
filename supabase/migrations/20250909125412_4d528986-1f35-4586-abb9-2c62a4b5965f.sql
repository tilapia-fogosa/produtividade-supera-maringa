-- Adicionar coluna ultima_sincronizacao na tabela alunos
ALTER TABLE public.alunos 
ADD COLUMN IF NOT EXISTS ultima_sincronizacao TIMESTAMP WITH TIME ZONE;

-- Adicionar coluna active na tabela turmas (se não existir)
ALTER TABLE public.turmas 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Adicionar coluna ultima_sincronizacao na tabela professores
ALTER TABLE public.professores 
ADD COLUMN IF NOT EXISTS ultima_sincronizacao TIMESTAMP WITH TIME ZONE;

-- Adicionar coluna ultima_sincronizacao na tabela turmas
ALTER TABLE public.turmas 
ADD COLUMN IF NOT EXISTS ultima_sincronizacao TIMESTAMP WITH TIME ZONE;