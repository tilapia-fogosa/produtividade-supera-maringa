
-- Tabela de referência para reações e respostas a mensagens do WhatsApp
CREATE TABLE public.whatsapp_message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  historico_comercial_id BIGINT NOT NULL REFERENCES public.historico_comercial(id) ON DELETE CASCADE,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('reacao', 'resposta')),
  emoji VARCHAR(10), -- emoji usado na reação (null se for resposta)
  mensagem_resposta TEXT, -- texto da resposta (null se for reação)
  profile_id UUID NOT NULL,
  profile_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index para buscar reações/respostas por mensagem
CREATE INDEX idx_whatsapp_reactions_historico_id ON public.whatsapp_message_reactions(historico_comercial_id);

-- RLS
ALTER TABLE public.whatsapp_message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reactions"
ON public.whatsapp_message_reactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert reactions"
ON public.whatsapp_message_reactions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete own reactions"
ON public.whatsapp_message_reactions FOR DELETE
TO authenticated
USING (profile_id = auth.uid());
