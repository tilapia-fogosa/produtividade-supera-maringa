-- Corrigir função para exibir reposições de funcionários sem turma definida
DROP FUNCTION IF EXISTS public.get_lista_completa_reposicoes();

CREATE OR REPLACE FUNCTION public.get_lista_completa_reposicoes()
 RETURNS TABLE(
   reposicao_id uuid, 
   data_reposicao date, 
   data_falta date, 
   aluno_nome text,  -- Mantem compatibilidade com frontend
   turma_original_nome text, 
   turma_reposicao_nome text, 
   observacoes text, 
   unit_id uuid, 
   aluno_id uuid,    -- Mantem compatibilidade (será pessoa_id)
   turma_original_id uuid, 
   turma_reposicao_id uuid,
   pessoa_tipo text  -- Novo campo para identificar se é aluno ou funcionário
 )
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  -- Reposições de alunos (mantém INNER JOIN pois alunos devem ter turma)
  SELECT 
    r.id as reposicao_id,
    r.data_reposicao,
    r.data_falta,
    a.nome as aluno_nome,
    t_original.nome as turma_original_nome,
    t_reposicao.nome as turma_reposicao_nome,
    r.observacoes,
    t_original.unit_id,
    r.pessoa_id as aluno_id,  -- Usa pessoa_id para compatibilidade
    a.turma_id as turma_original_id,
    r.turma_id as turma_reposicao_id,
    'aluno'::text as pessoa_tipo
  FROM reposicoes r
  JOIN alunos a ON r.pessoa_id = a.id
  JOIN turmas t_original ON a.turma_id = t_original.id
  JOIN turmas t_reposicao ON r.turma_id = t_reposicao.id
  WHERE a.active = true
    AND (r.pessoa_tipo = 'aluno' OR r.pessoa_tipo IS NULL)  -- Compatibilidade com dados antigos
  
  UNION ALL
  
  -- Reposições de funcionários (usa LEFT JOIN para permitir funcionários sem turma)
  SELECT 
    r.id as reposicao_id,
    r.data_reposicao,
    r.data_falta,
    f.nome as aluno_nome,  -- Usa nome do funcionário no campo aluno_nome para compatibilidade
    COALESCE(t_original.nome, 'Sem turma definida') as turma_original_nome,
    t_reposicao.nome as turma_reposicao_nome,
    r.observacoes,
    COALESCE(t_original.unit_id, f.unit_id) as unit_id,  -- Usa unit_id do funcionário se não tem turma
    r.pessoa_id as aluno_id,  -- Usa pessoa_id para compatibilidade
    f.turma_id as turma_original_id,  -- Pode ser NULL
    r.turma_id as turma_reposicao_id,
    'funcionario'::text as pessoa_tipo
  FROM reposicoes r
  JOIN funcionarios f ON r.pessoa_id = f.id
  LEFT JOIN turmas t_original ON f.turma_id = t_original.id  -- LEFT JOIN permite funcionários sem turma
  JOIN turmas t_reposicao ON r.turma_id = t_reposicao.id
  WHERE f.active = true
    AND r.pessoa_tipo = 'funcionario'
  
  ORDER BY data_reposicao DESC, aluno_nome ASC;
END;
$function$