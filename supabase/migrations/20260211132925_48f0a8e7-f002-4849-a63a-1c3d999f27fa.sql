
-- Atualizar RPC get_lista_completa_reposicoes com filtro por unit_id
CREATE OR REPLACE FUNCTION public.get_lista_completa_reposicoes(
  p_incluir_anteriores boolean DEFAULT false,
  p_unit_id uuid DEFAULT NULL
)
RETURNS TABLE(
  reposicao_id uuid, 
  data_reposicao date, 
  data_falta date, 
  aluno_nome text, 
  turma_original_nome text, 
  turma_reposicao_nome text, 
  turma_reposicao_professor text, 
  observacoes text, 
  unit_id uuid, 
  aluno_id uuid, 
  turma_original_id uuid, 
  turma_reposicao_id uuid, 
  pessoa_tipo text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    r.id as reposicao_id,
    r.data_reposicao,
    r.data_falta,
    CASE 
      WHEN r.pessoa_tipo = 'funcionario' THEN f.nome
      ELSE a.nome
    END as aluno_nome,
    t_orig.nome as turma_original_nome,
    t_repo.nome as turma_reposicao_nome,
    p.nome as turma_reposicao_professor,
    r.observacoes,
    r.unit_id,
    COALESCE(r.pessoa_id, r.aluno_id) as aluno_id,
    CASE 
      WHEN r.pessoa_tipo = 'funcionario' THEN f.turma_id
      ELSE a.turma_id
    END as turma_original_id,
    r.turma_id as turma_reposicao_id,
    COALESCE(r.pessoa_tipo, 'aluno') as pessoa_tipo
  FROM reposicoes r
  LEFT JOIN alunos a ON r.aluno_id = a.id AND (r.pessoa_tipo IS NULL OR r.pessoa_tipo = 'aluno')
  LEFT JOIN funcionarios f ON r.pessoa_id = f.id AND r.pessoa_tipo = 'funcionario'
  LEFT JOIN turmas t_orig ON (CASE WHEN r.pessoa_tipo = 'funcionario' THEN f.turma_id ELSE a.turma_id END) = t_orig.id
  LEFT JOIN turmas t_repo ON r.turma_id = t_repo.id
  LEFT JOIN professores p ON t_repo.professor_id = p.id
  WHERE 
    (CASE WHEN p_incluir_anteriores THEN true ELSE r.data_reposicao >= CURRENT_DATE END)
    AND (p_unit_id IS NULL OR r.unit_id = p_unit_id)
  ORDER BY r.data_reposicao DESC;
END;
$function$;

-- Atualizar RPC get_lista_aulas_experimentais com filtro por unit_id
CREATE OR REPLACE FUNCTION public.get_lista_aulas_experimentais(
  p_unit_id uuid DEFAULT NULL
)
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
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ae.id as aula_experimental_id,
    ae.data_aula_experimental,
    ae.cliente_nome,
    CASE 
      WHEN ae.responsavel_tipo = 'professor' THEN prof.nome
      WHEN ae.responsavel_tipo = 'funcionario' THEN func.nome
      ELSE 'Não identificado'
    END as responsavel_nome,
    ae.responsavel_tipo,
    ae.descricao_cliente,
    t.nome as turma_nome,
    ae.unit_id,
    ae.turma_id,
    ae.responsavel_id
  FROM aulas_experimentais ae
  JOIN turmas t ON ae.turma_id = t.id
  LEFT JOIN professores prof ON ae.responsavel_id::text = prof.id::text AND ae.responsavel_tipo = 'professor'
  LEFT JOIN funcionarios func ON ae.responsavel_id::text = func.id::text AND ae.responsavel_tipo = 'funcionario'
  WHERE ae.active = true
    AND (p_unit_id IS NULL OR ae.unit_id = p_unit_id)
  ORDER BY ae.data_aula_experimental DESC, ae.cliente_nome ASC;
END;
$function$;
