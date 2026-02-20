
-- Drop a função existente para poder recriá-la com novo retorno
DROP FUNCTION IF EXISTS public.get_lista_completa_reposicoes();

-- Recria a função com o campo turma_reposicao_professor incluído
CREATE FUNCTION public.get_lista_completa_reposicoes()
RETURNS TABLE (
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
SET search_path = public
AS $$
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
  WHERE r.data_reposicao >= CURRENT_DATE
  ORDER BY r.data_reposicao ASC;
END;
$$;
