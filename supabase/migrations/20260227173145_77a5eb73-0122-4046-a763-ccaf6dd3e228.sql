-- Adicionar coluna para vincular resposta à mensagem original
ALTER TABLE public.historico_comercial
ADD COLUMN quoted_message_id bigint REFERENCES public.historico_comercial(id);

-- Criar índice para consultas de mensagens citadas
CREATE INDEX idx_historico_comercial_quoted_message_id ON public.historico_comercial(quoted_message_id) WHERE quoted_message_id IS NOT NULL;