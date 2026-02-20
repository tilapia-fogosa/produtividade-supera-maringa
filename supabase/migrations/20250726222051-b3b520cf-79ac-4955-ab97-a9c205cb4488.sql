-- Corrigir função get_turma_modal_data para usar 'observacoes' ao invés de 'motivo'
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
$function$