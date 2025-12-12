-- Adicionar coluna funcionario_registro_id na tabela produtividade_abaco
-- para registrar qual funcionário fez o lançamento
ALTER TABLE public.produtividade_abaco
ADD COLUMN funcionario_registro_id uuid REFERENCES public.funcionarios(id);

-- Criar índice para melhorar performance de buscas
CREATE INDEX idx_produtividade_abaco_funcionario_registro 
ON public.produtividade_abaco(funcionario_registro_id);

-- Comentário na coluna
COMMENT ON COLUMN public.produtividade_abaco.funcionario_registro_id IS 'ID do funcionário que registrou a produtividade';