
-- 1. Tornar client_id nullable
ALTER TABLE public.aulas_inaugurais ALTER COLUMN client_id DROP NOT NULL;

-- 2. Migrar registros faltantes de eventos_professor que não foram incluídos antes
-- (aqueles sem atividade_pos_venda_id ou cujo apv.unit_id era NULL)
INSERT INTO public.aulas_inaugurais (
  evento_professor_id, atividade_pos_venda_id, client_id, unit_id,
  professor_id, data, horario_inicio, horario_fim,
  created_by, created_at
)
SELECT
  ep.id,
  ep.atividade_pos_venda_id,
  ep.client_id,
  COALESCE(apv.unit_id, (SELECT id FROM public.units WHERE name = 'Maringá' AND active = true LIMIT 1)),
  ep.professor_id,
  ep.data,
  ep.horario_inicio,
  ep.horario_fim,
  ep.created_by,
  ep.created_at
FROM eventos_professor ep
LEFT JOIN atividade_pos_venda apv ON apv.id = ep.atividade_pos_venda_id
WHERE ep.tipo_evento = 'aula_zero'
  AND ep.id NOT IN (SELECT evento_professor_id FROM public.aulas_inaugurais WHERE evento_professor_id IS NOT NULL);
