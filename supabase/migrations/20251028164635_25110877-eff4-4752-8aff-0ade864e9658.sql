-- Adicionar coluna data_nascimento na tabela alunos
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS data_nascimento date;

-- Adicionar coluna data_nascimento na tabela funcionarios  
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS data_nascimento date;