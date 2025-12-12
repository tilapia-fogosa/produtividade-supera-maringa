-- Fase 7.2 e 7.3: Adicionar coluna funcionario_registro_id nas tabelas

-- Adicionar coluna na tabela alerta_evasao para rastrear quem registrou
ALTER TABLE public.alerta_evasao ADD COLUMN IF NOT EXISTS funcionario_registro_id UUID REFERENCES public.funcionarios(id);

-- Comentário para documentação
COMMENT ON COLUMN public.alerta_evasao.funcionario_registro_id IS 'ID do funcionário logado que registrou o alerta';