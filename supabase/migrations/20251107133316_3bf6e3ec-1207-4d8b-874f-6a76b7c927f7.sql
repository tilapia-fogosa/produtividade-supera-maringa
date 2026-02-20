-- Drop e recriar função RPC com coluna perfil
DROP FUNCTION IF EXISTS get_calendario_eventos_unificados(date, date, uuid);

CREATE FUNCTION get_calendario_eventos_unificados(
  p_data_inicio date,
  p_data_fim date,
  p_unit_id uuid DEFAULT NULL
)
RETURNS TABLE (
  evento_id text,
  tipo_evento text,
  unit_id uuid,
  dia_semana text,
  horario_inicio text,
  horario_fim text,
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
LANGUAGE sql
AS $$
  SELECT * FROM vw_calendario_eventos_unificados vce
  WHERE (p_unit_id IS NULL OR vce.unit_id = p_unit_id)
$$;