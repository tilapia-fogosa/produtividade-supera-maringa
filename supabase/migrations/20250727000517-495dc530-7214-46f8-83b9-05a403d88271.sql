-- Atualizar a função get_calendario_turmas_semana_com_reposicoes para filtrar aulas experimentais ativas
CREATE OR REPLACE FUNCTION public.get_calendario_turmas_semana_com_reposicoes(p_data_inicio date, p_data_fim date)
RETURNS TABLE(turma_id uuid, unit_id uuid, nome_completo text, dia_semana dia_semana, sala text, professor_id uuid, professor_nome text, professor_slack text, horario_inicio text, categoria text, total_alunos_ativos bigint, total_reposicoes bigint, total_aulas_experimentais bigint, created_at timestamp with time zone)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
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
    COALESCE(COUNT(r.id) FILTER (WHERE r.data_reposicao BETWEEN p_data_inicio AND p_data_fim), 0) as total_reposicoes,
    COALESCE(COUNT(ae.id) FILTER (WHERE ae.data_aula_experimental BETWEEN p_data_inicio AND p_data_fim AND ae.active = true), 0) as total_aulas_experimentais,
    ctv.created_at
  FROM calendario_turmas_view ctv
  LEFT JOIN reposicoes r ON r.turma_id = ctv.turma_id 
    AND r.data_reposicao BETWEEN p_data_inicio AND p_data_fim
  LEFT JOIN aulas_experimentais ae ON ae.turma_id = ctv.turma_id
    AND ae.data_aula_experimental BETWEEN p_data_inicio AND p_data_fim
    AND ae.active = true
  GROUP BY 
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
    ctv.created_at
  ORDER BY ctv.horario_inicio, ctv.nome_completo;
END;
$function$;

-- Atualizar a função get_turma_modal_data para filtrar aulas experimentais ativas
CREATE OR REPLACE FUNCTION public.get_turma_modal_data(p_turma_id uuid, p_data_consulta date DEFAULT NULL::date)
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'turma', json_build_object(
      'id', t.id,
      'nome', t.nome,
      'sala', t.sala,
      'dia_semana', t.dia_semana,
      'unit_id', t.unit_id
    ),
    'professor', json_build_object(
      'id', p.id,
      'nome', p.nome,
      'slack_username', p.slack_username
    ),
    'alunos', COALESCE(
      (SELECT json_agg(
        json_build_object(
          'id', a.id,
          'nome', a.nome,
          'idade', a.idade,
          'dias_supera', a.dias_supera,
          'foto_url', null,
          'telefone', a.telefone,
          'email', a.email
        ) ORDER BY a.nome ASC
      )
      FROM alunos a
      WHERE a.turma_id = t.id 
        AND a.active = true), 
      '[]'::json
    ),
    'reposicoes', CASE 
      WHEN p_data_consulta IS NOT NULL THEN
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', a.id,
              'nome', a.nome,
              'idade', a.idade,
              'dias_supera', a.dias_supera,
              'foto_url', null,
              'telefone', a.telefone,
              'email', a.email,
              'data_reposicao', r.data_reposicao,
              'observacoes', r.observacoes
            ) ORDER BY a.nome ASC
          )
          FROM reposicoes r
          JOIN alunos a ON r.aluno_id = a.id
          WHERE r.turma_id = t.id 
            AND r.data_reposicao = p_data_consulta
            AND a.active = true), 
          '[]'::json
        )
      ELSE '[]'::json
    END,
    'aulas_experimentais', CASE 
      WHEN p_data_consulta IS NOT NULL THEN
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', ae.id,
              'cliente_nome', ae.cliente_nome,
              'data_aula_experimental', ae.data_aula_experimental,
              'responsavel_id', ae.responsavel_id,
              'responsavel_tipo', ae.responsavel_tipo,
              'descricao_cliente', ae.descricao_cliente,
              'responsavel_nome', CASE 
                WHEN ae.responsavel_tipo = 'professor' THEN prof.nome
                WHEN ae.responsavel_tipo = 'funcionario' THEN func.nome
                ELSE NULL
              END
            ) ORDER BY ae.cliente_nome ASC
          )
          FROM aulas_experimentais ae
          LEFT JOIN professores prof ON ae.responsavel_id::text = prof.id::text AND ae.responsavel_tipo = 'professor'
          LEFT JOIN funcionarios func ON ae.responsavel_id::text = func.id::text AND ae.responsavel_tipo = 'funcionario'
          WHERE ae.turma_id = t.id 
            AND ae.data_aula_experimental = p_data_consulta
            AND ae.active = true), 
          '[]'::json
        )
      ELSE '[]'::json
    END,
    'estatisticas', json_build_object(
      'total_alunos_ativos', (
        SELECT COUNT(*)
        FROM alunos a
        WHERE a.turma_id = t.id AND a.active = true
      ),
      'total_reposicoes_dia', CASE 
        WHEN p_data_consulta IS NOT NULL THEN
          (SELECT COUNT(*)
           FROM reposicoes r
           JOIN alunos a ON r.aluno_id = a.id
           WHERE r.turma_id = t.id 
             AND r.data_reposicao = p_data_consulta
             AND a.active = true)
        ELSE 0
      END,
      'total_aulas_experimentais_dia', CASE 
        WHEN p_data_consulta IS NOT NULL THEN
          (SELECT COUNT(*)
           FROM aulas_experimentais ae
           WHERE ae.turma_id = t.id 
             AND ae.data_aula_experimental = p_data_consulta
             AND ae.active = true)
        ELSE 0
      END,
      'media_idade', (
        SELECT ROUND(AVG(a.idade), 1)
        FROM alunos a
        WHERE a.turma_id = t.id AND a.active = true AND a.idade IS NOT NULL
      ),
      'media_dias_supera', (
        SELECT ROUND(AVG(a.dias_supera), 0)
        FROM alunos a
        WHERE a.turma_id = t.id AND a.active = true AND a.dias_supera IS NOT NULL
      )
    )
  )
  INTO result
  FROM turmas t
  LEFT JOIN professores p ON t.professor_id = p.id
  WHERE t.id = p_turma_id;
  
  RETURN result;
END;
$function$;