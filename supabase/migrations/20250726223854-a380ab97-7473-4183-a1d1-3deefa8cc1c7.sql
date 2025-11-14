-- Criar função para buscar lista completa de reposições
CREATE OR REPLACE FUNCTION public.get_lista_completa_reposicoes()
 RETURNS TABLE(
   reposicao_id uuid,
   data_reposicao date,
   aluno_nome text,
   turma_original_nome text,
   turma_reposicao_nome text,
   observacoes text,
   unit_id uuid,
   aluno_id uuid,
   turma_original_id uuid,
   turma_reposicao_id uuid
 )
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    r.id as reposicao_id,
    r.data_reposicao,
    a.nome as aluno_nome,
    t_original.nome as turma_original_nome,
    t_reposicao.nome as turma_reposicao_nome,
    r.observacoes,
    t_original.unit_id,
    r.aluno_id,
    a.turma_id as turma_original_id,
    r.turma_id as turma_reposicao_id
  FROM reposicoes r
  JOIN alunos a ON r.aluno_id = a.id
  JOIN turmas t_original ON a.turma_id = t_original.id
  JOIN turmas t_reposicao ON r.turma_id = t_reposicao.id
  WHERE a.active = true
  ORDER BY r.data_reposicao DESC, a.nome ASC;
END;
$function$

-- Criar função para deletar reposição
CREATE OR REPLACE FUNCTION public.delete_reposicao(p_reposicao_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Deletar a reposição
  DELETE FROM reposicoes 
  WHERE id = p_reposicao_id;
  
  -- Verificar se alguma linha foi deletada
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Retornar true se deletou com sucesso
  RETURN deleted_count > 0;
END;
$function$