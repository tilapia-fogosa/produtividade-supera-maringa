ALTER TABLE public.atividade_pos_venda
  ADD COLUMN IF NOT EXISTS percepcao_coordenador text,
  ADD COLUMN IF NOT EXISTS motivo_procura text,
  ADD COLUMN IF NOT EXISTS avaliacao_abaco text,
  ADD COLUMN IF NOT EXISTS avaliacao_ah text,
  ADD COLUMN IF NOT EXISTS pontos_atencao text;