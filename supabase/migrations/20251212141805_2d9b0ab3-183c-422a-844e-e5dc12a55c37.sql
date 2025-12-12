-- Adicionar coluna funcionario_registro_id na tabela ah_recolhidas
ALTER TABLE public.ah_recolhidas 
ADD COLUMN IF NOT EXISTS funcionario_registro_id uuid;

-- Adicionar coluna funcionario_registro_id na tabela produtividade_ah
ALTER TABLE public.produtividade_ah 
ADD COLUMN IF NOT EXISTS funcionario_registro_id uuid;