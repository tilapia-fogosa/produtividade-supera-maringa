-- Atualizar função get_turma_modal_data para incluir faltas futuras do dia
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
          'email', a.email,
          'is_funcionario', false
        ) ORDER BY a.nome ASC
      )
      FROM alunos a
      WHERE a.turma_id = t.id 
        AND a.active = true), 
      '[]'::json
    ),
    'funcionarios', COALESCE(
      (SELECT json_agg(
        json_build_object(
          'id', f.id,
          'nome', f.nome,
          'idade', f.idade,
          'dias_supera', f.dias_supera,
          'foto_url', null,
          'telefone', f.telefone,
          'email', f.email,
          'cargo', f.cargo,
          'is_funcionario', true
        ) ORDER BY f.nome ASC
      )
      FROM funcionarios f
      WHERE f.turma_id = t.id 
        AND f.active = true), 
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
      'total_funcionarios_ativos', (
        SELECT COUNT(*)
        FROM funcionarios f
        WHERE f.turma_id = t.id AND f.active = true
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
      'total_faltas_futuras_dia', CASE 
        WHEN p_data_consulta IS NOT NULL THEN
          (SELECT COUNT(*)
           FROM faltas_antecipadas fa
           JOIN alunos a ON fa.aluno_id = a.id
           WHERE fa.turma_id = t.id 
             AND fa.data_falta = p_data_consulta
             AND fa.active = true
             AND a.active = true)
        ELSE 0
      END,
      'media_idade', (
        SELECT ROUND(AVG(idade), 1)
        FROM (
          SELECT idade FROM alunos a WHERE a.turma_id = t.id AND a.active = true AND a.idade IS NOT NULL
          UNION ALL
          SELECT idade FROM funcionarios f WHERE f.turma_id = t.id AND f.active = true AND f.idade IS NOT NULL
        ) combined_ages
      ),
      'media_dias_supera', (
        SELECT ROUND(AVG(dias_supera), 0)
        FROM (
          SELECT dias_supera FROM alunos a WHERE a.turma_id = t.id AND a.active = true AND a.dias_supera IS NOT NULL
          UNION ALL
          SELECT dias_supera FROM funcionarios f WHERE f.turma_id = t.id AND f.active = true AND f.dias_supera IS NOT NULL
        ) combined_dias
      )
    )
  )
  INTO result
  FROM turmas t
  LEFT JOIN professores p ON t.professor_id = p.id
  WHERE t.id = p_turma_id;
  
  RETURN result;
END;
$function$