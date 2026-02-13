
-- Add unit_id column to atividade_pos_venda (UUID type)
ALTER TABLE public.atividade_pos_venda
ADD COLUMN unit_id uuid REFERENCES public.units(id);

-- Backfill existing records with Maringá unit_id
UPDATE public.atividade_pos_venda
SET unit_id = '0df79a04-444e-46ee-b218-59e4b1835f4a'
WHERE unit_id IS NULL;

-- Make it NOT NULL after backfill
ALTER TABLE public.atividade_pos_venda
ALTER COLUMN unit_id SET NOT NULL;
