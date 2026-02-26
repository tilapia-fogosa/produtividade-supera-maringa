CREATE OR REPLACE FUNCTION get_lista_aulas_experimentais(p_unit_id uuid DEFAULT NULL)
RETURNS TABLE(
  aula_experimental_id uuid,
  data_aula_experimental date,
  cliente_nome text,
  responsavel_nome text,
  responsavel_tipo text,
  descricao_cliente text,
  turma_nome text,
  unit_id uuid,
  turma_id uuid,
  responsavel_id uuid
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ae.id as aula_experimental_id,
    ae.data_aula_experimental,
    ae.cliente_nome,
    COALESCE(prof.nome, 'Não identificado') as responsavel_nome,
    'professor'::text as responsavel_tipo,
    ae.descricao_cliente,
    t.nome as turma_nome,
    ae.unit_id,
    ae.turma_id,
    t.professor_id as responsavel_id
  FROM aulas_experimentais ae
  JOIN turmas t ON ae.turma_id = t.id
  LEFT JOIN professores prof ON t.professor_id = prof.id
  WHERE ae.active = true
    AND (p_unit_id IS NULL OR ae.unit_id = p_unit_id)
  ORDER BY ae.data_aula_experimental DESC, ae.cliente_nome ASC;
END;
$$;