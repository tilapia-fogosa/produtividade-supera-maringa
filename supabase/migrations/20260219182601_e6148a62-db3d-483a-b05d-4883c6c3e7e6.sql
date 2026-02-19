
-- Adicionar coluna atividade_pos_venda_id na tabela eventos_professor
ALTER TABLE public.eventos_professor
ADD COLUMN atividade_pos_venda_id UUID REFERENCES public.atividade_pos_venda(id);

-- Backfill: vincular eventos existentes ao registro mais recente da atividade_pos_venda
UPDATE public.eventos_professor ep
SET atividade_pos_venda_id = (
  SELECT apv.id FROM public.atividade_pos_venda apv
  WHERE apv.client_id = ep.client_id
  ORDER BY apv.created_at DESC
  LIMIT 1
)
WHERE ep.tipo_evento = 'aula_zero'
  AND ep.client_id IS NOT NULL
  AND ep.atividade_pos_venda_id IS NULL;
