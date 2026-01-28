-- Adicionar coluna para data da primeira mensalidade na tabela alunos
ALTER TABLE public.alunos 
ADD COLUMN IF NOT EXISTS data_primeira_mensalidade date;

-- Comentário explicativo
COMMENT ON COLUMN public.alunos.data_primeira_mensalidade IS 'Data da primeira mensalidade do contrato, preenchida no pós-matrícula';