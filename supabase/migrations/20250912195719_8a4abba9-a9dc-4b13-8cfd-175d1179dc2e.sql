-- Adicionar campos para cadastro de novos alunos
ALTER TABLE public.alunos 
ADD COLUMN material_entregue boolean DEFAULT false,
ADD COLUMN kit_sugerido text;