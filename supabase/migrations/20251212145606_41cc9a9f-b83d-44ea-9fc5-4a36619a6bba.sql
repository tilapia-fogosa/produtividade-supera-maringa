-- Fase 9: Adicionar funcionario_registro_id nas tabelas de eventos e camisetas

-- Adicionar coluna na tabela eventos para rastrear quem criou o evento
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS funcionario_registro_id UUID REFERENCES public.funcionarios(id);

-- Adicionar coluna na tabela camisetas para rastrear o funcionário que registrou a entrega
ALTER TABLE public.camisetas ADD COLUMN IF NOT EXISTS funcionario_registro_id UUID REFERENCES public.funcionarios(id);

-- Comentários para documentação
COMMENT ON COLUMN public.eventos.funcionario_registro_id IS 'ID do funcionário que criou/registrou o evento';
COMMENT ON COLUMN public.camisetas.funcionario_registro_id IS 'ID do funcionário que registrou a entrega da camiseta';