-- Atualizar função para incluir contagem de faltas futuras
CREATE OR REPLACE FUNCTION public.get_calendario_turmas_semana_com_reposicoes(p_data_inicio date, p_data_fim date)
 RETURNS TABLE(turma_id uuid, unit_id uuid, nome_completo text, dia_semana dia_semana, sala text, professor_id uuid, professor_nome text, professor_slack text, horario_inicio text, categoria text, total_alunos_ativos bigint, total_reposicoes bigint, total_aulas_experimentais bigint, total_faltas_futuras bigint, created_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH reposicoes_count AS (
    SELECT 
      r.turma_id,
      COUNT(r.id) as count_reposicoes
    FROM reposicoes r
    WHERE r.data_reposicao BETWEEN p_data_inicio AND p_data_fim
    GROUP BY r.turma_id
  ),
  aulas_experimentais_count AS (
    SELECT 
      ae.turma_id,
      COUNT(ae.id) as count_aulas_experimentais
    FROM aulas_experimentais ae
    WHERE ae.data_aula_experimental BETWEEN p_data_inicio AND p_data_fim
      AND ae.active = true
    GROUP BY ae.turma_id
  ),
  faltas_futuras_count AS (
    SELECT 
      fa.turma_id,
      COUNT(fa.id) as count_faltas_futuras
    FROM faltas_antecipadas fa
    WHERE fa.data_falta BETWEEN p_data_inicio AND p_data_fim
      AND fa.active = true
    GROUP BY fa.turma_id
  )
  SELECT 
    ctv.turma_id,
    ctv.unit_id,
    ctv.nome_completo,
    ctv.dia_semana,
    ctv.sala,
    ctv.professor_id,
    ctv.professor_nome,
    ctv.professor_slack,
    ctv.horario_inicio,
    ctv.categoria,
    ctv.total_alunos_ativos,
    COALESCE(rc.count_reposicoes, 0) as total_reposicoes,
    COALESCE(aec.count_aulas_experimentais, 0) as total_aulas_experimentais,
    COALESCE(ffc.count_faltas_futuras, 0) as total_faltas_futuras,
    ctv.created_at
  FROM calendario_turmas_view ctv
  LEFT JOIN reposicoes_count rc ON rc.turma_id = ctv.turma_id
  LEFT JOIN aulas_experimentais_count aec ON aec.turma_id = ctv.turma_id
  LEFT JOIN faltas_futuras_count ffc ON ffc.turma_id = ctv.turma_id
  ORDER BY ctv.horario_inicio, ctv.nome_completo;
END;
$function$