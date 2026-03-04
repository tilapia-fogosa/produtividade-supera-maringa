
-- Adicionar coluna atividade_pos_venda_id na tabela alunos
ALTER TABLE public.alunos 
ADD COLUMN atividade_pos_venda_id uuid REFERENCES public.atividade_pos_venda(id);

-- Migrar dados existentes: popular atividade_pos_venda_id com base nos client_id já vinculados
UPDATE public.alunos a
SET atividade_pos_venda_id = apv.id
FROM public.atividade_pos_venda apv
WHERE a.client_id = apv.client_id
  AND a.client_id IS NOT NULL
  AND a.atividade_pos_venda_id IS NULL;
