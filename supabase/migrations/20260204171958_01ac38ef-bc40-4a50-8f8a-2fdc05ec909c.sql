-- Corrigir a função removendo r.active que não existe na tabela reposicoes
DROP FUNCTION IF EXISTS public.get_calendario_eventos_unificados(date, date, uuid);

CREATE OR REPLACE FUNCTION public.get_calendario_eventos_unificados(
  p_data_inicio date, 
  p_data_fim date, 
  p_unit_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  evento_id text,
  tipo_evento text,
  unit_id uuid,
  dia_semana text,
  horario_inicio time,
  horario_fim time,
  sala_id uuid,
  sala_nome text,
  sala_cor text,
  titulo text,
  descricao text,
  professor_id uuid,
  professor_nome text,
  professor_slack text,
  perfil text,
  data_especifica date,
  total_alunos_ativos integer,
  total_funcionarios_ativos integer,
  total_reposicoes integer,
  total_aulas_experimentais integer,
  total_faltas_futuras integer,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH reposicoes_por_turma AS (
    SELECT r.turma_id, COUNT(*)::integer as total
    FROM reposicoes r
    WHERE r.data_reposicao BETWEEN p_data_inicio AND p_data_fim
    GROUP BY r.turma_id
  ),
  aulas_experimentais_por_turma AS (
    SELECT ae.turma_id, COUNT(*)::integer as total
    FROM aulas_experimentais ae
    WHERE ae.data_aula_experimental BETWEEN p_data_inicio AND p_data_fim
      AND ae.active = true
    GROUP BY ae.turma_id
  ),
  faltas_futuras_por_turma AS (
    SELECT a.turma_id, COUNT(*)::integer as total
    FROM faltas_antecipadas fa
    JOIN alunos a ON fa.aluno_id = a.id
    WHERE fa.data_falta BETWEEN p_data_inicio AND p_data_fim
      AND fa.active = true
      AND a.active = true
    GROUP BY a.turma_id
  )
  SELECT 
    vce.evento_id,
    vce.tipo_evento,
    vce.unit_id,
    vce.dia_semana,
    vce.horario_inicio,
    vce.horario_fim,
    vce.sala_id,
    vce.sala_nome,
    vce.sala_cor,
    vce.titulo,
    vce.descricao,
    vce.professor_id,
    vce.professor_nome,
    vce.professor_slack,
    vce.perfil,
    vce.data_especifica,
    vce.total_alunos_ativos,
    vce.total_funcionarios_ativos,
    COALESCE(rpt.total, 0)::integer as total_reposicoes,
    COALESCE(aept.total, 0)::integer as total_aulas_experimentais,
    COALESCE(ffpt.total, 0)::integer as total_faltas_futuras,
    vce.created_at
  FROM vw_calendario_eventos_unificados vce
  LEFT JOIN reposicoes_por_turma rpt ON rpt.turma_id = vce.evento_id::uuid
  LEFT JOIN aulas_experimentais_por_turma aept ON aept.turma_id = vce.evento_id::uuid
  LEFT JOIN faltas_futuras_por_turma ffpt ON ffpt.turma_id = vce.evento_id::uuid
  WHERE (p_unit_id IS NULL OR vce.unit_id = p_unit_id);
END;
$$;