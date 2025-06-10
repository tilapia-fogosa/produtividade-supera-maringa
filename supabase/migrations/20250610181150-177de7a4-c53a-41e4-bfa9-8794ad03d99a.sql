
-- Adicionar campo valor_mensalidade na tabela alunos
ALTER TABLE public.alunos 
ADD COLUMN valor_mensalidade NUMERIC(10,2);

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN public.alunos.valor_mensalidade IS 'Valor da mensalidade do aluno em reais';
