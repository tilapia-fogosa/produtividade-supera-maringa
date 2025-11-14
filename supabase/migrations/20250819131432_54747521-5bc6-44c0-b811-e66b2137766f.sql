-- Habilitar Realtime para a tabela faltas_antecipadas
ALTER TABLE public.faltas_antecipadas REPLICA IDENTITY FULL;

-- Adicionar à publicação do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.faltas_antecipadas;