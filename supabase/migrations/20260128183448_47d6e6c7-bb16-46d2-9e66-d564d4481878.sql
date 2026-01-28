-- Adicionar coluna para sincronização SGS
ALTER TABLE public.atividade_pos_venda
ADD COLUMN IF NOT EXISTS check_sincronizar_sgs boolean DEFAULT false;