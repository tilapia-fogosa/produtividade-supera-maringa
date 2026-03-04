
CREATE TABLE public.aulas_inaugurais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vínculos
  aluno_id uuid REFERENCES public.alunos(id) ON DELETE SET NULL,
  atividade_pos_venda_id uuid REFERENCES public.atividade_pos_venda(id) ON DELETE SET NULL,
  evento_professor_id uuid REFERENCES public.eventos_professor(id) ON DELETE SET NULL,
  client_id uuid NOT NULL,
  unit_id uuid NOT NULL REFERENCES public.units(id),
  professor_id uuid REFERENCES public.professores(id) ON DELETE SET NULL,
  sala_id uuid REFERENCES public.salas(id) ON DELETE SET NULL,
  
  -- Agendamento
  data date NOT NULL,
  horario_inicio time NOT NULL,
  horario_fim time NOT NULL,
  
  -- Status
  status text NOT NULL DEFAULT 'agendada',
  
  -- Dados pedagógicos
  percepcao_coordenador text,
  motivo_procura text,
  avaliacao_abaco text,
  avaliacao_ah text,
  pontos_atencao text,
  coordenador_responsavel text,
  
  -- Metadados
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.aulas_inaugurais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_unit"
  ON public.aulas_inaugurais FOR SELECT TO authenticated
  USING (public.user_has_access_to_unit(unit_id));

CREATE POLICY "users_insert_own_unit"
  ON public.aulas_inaugurais FOR INSERT TO authenticated
  WITH CHECK (public.user_has_access_to_unit(unit_id));

CREATE POLICY "users_update_own_unit"
  ON public.aulas_inaugurais FOR UPDATE TO authenticated
  USING (public.user_has_access_to_unit(unit_id));

CREATE POLICY "users_delete_own_unit"
  ON public.aulas_inaugurais FOR DELETE TO authenticated
  USING (public.user_has_access_to_unit(unit_id));

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.aulas_inaugurais
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Migrar dados existentes
INSERT INTO public.aulas_inaugurais (
  evento_professor_id, atividade_pos_venda_id, client_id, unit_id,
  professor_id, data, horario_inicio, horario_fim,
  percepcao_coordenador, motivo_procura, avaliacao_abaco, avaliacao_ah, pontos_atencao,
  created_by, created_at
)
SELECT
  ep.id,
  ep.atividade_pos_venda_id,
  COALESCE(ep.client_id, apv.client_id),
  apv.unit_id,
  ep.professor_id,
  ep.data,
  ep.horario_inicio,
  ep.horario_fim,
  apv.percepcao_coordenador,
  apv.motivo_procura,
  apv.avaliacao_abaco,
  apv.avaliacao_ah,
  apv.pontos_atencao,
  ep.created_by,
  ep.created_at
FROM eventos_professor ep
LEFT JOIN atividade_pos_venda apv ON apv.id = ep.atividade_pos_venda_id
WHERE ep.tipo_evento = 'aula_zero'
  AND apv.unit_id IS NOT NULL;
