-- Remove função antiga com ambiguidade
DROP FUNCTION IF EXISTS public.get_turma_modal_data(uuid);

-- Mantém apenas a função com 2 parâmetros: get_turma_modal_data(uuid, date)