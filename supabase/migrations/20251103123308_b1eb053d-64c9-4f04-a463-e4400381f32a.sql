-- Adicionar campos responsavel_id e valor_pago à tabela evento_participantes
ALTER TABLE public.evento_participantes 
  ADD COLUMN responsavel_id uuid,
  ADD COLUMN valor_pago numeric(10,2);