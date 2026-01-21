-- Adicionar coluna status na tabela atividades_alerta_evasao
ALTER TABLE public.atividades_alerta_evasao 
ADD COLUMN status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluida'));

-- Criar índice para consultas por status
CREATE INDEX idx_atividades_alerta_evasao_status ON public.atividades_alerta_evasao(alerta_evasao_id, status);