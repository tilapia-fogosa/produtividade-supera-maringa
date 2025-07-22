
-- Função RPC para buscar dados completos da turma para o modal
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
      'dia_semana', t.dia_semana
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
          'foto_url', null -- Placeholder para quando implementarmos fotos
        )
      )
      FROM alunos a
      WHERE a.turma_id = t.id 
        AND a.active = true
      ORDER BY a.nome), 
      '[]'::json
    )
  )
  INTO result
  FROM turmas t
  LEFT JOIN professores p ON t.professor_id = p.id
  WHERE t.id = p_turma_id;
  
  RETURN result;
END;
$$;

-- Conceder permissões para usar a função
GRANT EXECUTE ON FUNCTION get_turma_modal_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_turma_modal_data(UUID) TO anon;
