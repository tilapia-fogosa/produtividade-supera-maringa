-- Corrigir tabela data_imports - tornar created_by opcional
ALTER TABLE public.data_imports ALTER COLUMN created_by DROP NOT NULL;

-- Corrigir tabelas de backup - adicionar colunas faltantes
ALTER TABLE public.alunos_backup1 
ADD COLUMN IF NOT EXISTS foto_url text,
ADD COLUMN IF NOT EXISTS material_entregue boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS kit_sugerido text;

ALTER TABLE public.alunos_backup2 
ADD COLUMN IF NOT EXISTS foto_url text,
ADD COLUMN IF NOT EXISTS material_entregue boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS kit_sugerido text;