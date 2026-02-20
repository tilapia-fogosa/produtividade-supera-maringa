-- Corrigir a função RPC para buscar dados da turma com ordenação correta
CREATE OR REPLACE FUNCTION get_turma_modal_data(p_turma_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'turma', json_build_object(
      'id', t.id,
      'nome', t.nome,
      'sala', t.sala,
      'dia_semana', t.dia_semana,
      'horario_inicio', t.horario_inicio,
      'horario_fim', t.horario_fim
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
    'estatisticas', json_build_object(
      'total_alunos_ativos', (
        SELECT COUNT(*)
        FROM alunos a
        WHERE a.turma_id = t.id AND a.active = true
      ),
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
$$;