-- Fase 8: Adicionar coluna funcionario_registro_id nas tabelas de calendário

-- Reposições
ALTER TABLE public.reposicoes ADD COLUMN IF NOT EXISTS funcionario_registro_id UUID REFERENCES public.funcionarios(id);
COMMENT ON COLUMN public.reposicoes.funcionario_registro_id IS 'ID do funcionário logado que registrou a reposição';

-- Aulas Experimentais
ALTER TABLE public.aulas_experimentais ADD COLUMN IF NOT EXISTS funcionario_registro_id UUID REFERENCES public.funcionarios(id);
COMMENT ON COLUMN public.aulas_experimentais.funcionario_registro_id IS 'ID do funcionário logado que registrou a aula experimental';

-- Faltas Antecipadas/Futuras
ALTER TABLE public.faltas_antecipadas ADD COLUMN IF NOT EXISTS funcionario_registro_id UUID REFERENCES public.funcionarios(id);
COMMENT ON COLUMN public.faltas_antecipadas.funcionario_registro_id IS 'ID do funcionário logado que registrou a falta';

-- Eventos de Sala
ALTER TABLE public.eventos_sala ADD COLUMN IF NOT EXISTS funcionario_registro_id UUID REFERENCES public.funcionarios(id);
COMMENT ON COLUMN public.eventos_sala.funcionario_registro_id IS 'ID do funcionário logado que criou a reserva de sala';