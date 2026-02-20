-- Criar função RPC otimizada para buscar alunos com histórico de retenções e alertas
-- Esta função inclui TODOS os alunos que têm alertas OU retenções, não apenas os que têm retenções
CREATE OR REPLACE FUNCTION get_alunos_retencoes_historico(
  p_search_term text DEFAULT '',
  p_status_filter text DEFAULT 'todos'
)
RETURNS TABLE(
  id uuid,
  nome text,
  turma text,
  educador text,
  total_alertas bigint,
  alertas_ativos bigint,
  total_retencoes bigint,
  ultimo_alerta timestamp with time zone,
  ultima_retencao timestamp with time zone,
  status text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH alunos_com_dados AS (
    SELECT 
      a.id,
      a.nome,
      COALESCE(t.nome, 'Sem turma') as turma,
      COALESCE(p.nome, 'Sem educador') as educador,
      -- Contar total de alertas
      COALESCE(COUNT(ae.id), 0) as total_alertas,
      -- Contar alertas ativos (status diferente de 'resolvido')
      COALESCE(COUNT(ae.id) FILTER (WHERE ae.status != 'resolvido'), 0) as alertas_ativos,
      -- Contar total de retenções
      COALESCE(COUNT(r.id), 0) as total_retencoes,
      -- Data do último alerta
      MAX(ae.created_at) as ultimo_alerta,
      -- Data da última retenção
      MAX(r.created_at) as ultima_retencao
    FROM alunos a
    LEFT JOIN turmas t ON a.turma_id = t.id
    LEFT JOIN professores p ON t.professor_id = p.id
    LEFT JOIN alerta_evasao ae ON a.id = ae.aluno_id
    LEFT JOIN retencoes r ON a.id = r.aluno_id
    WHERE a.active = true
      AND (p_search_term = '' OR LOWER(a.nome) LIKE LOWER('%' || p_search_term || '%'))
    GROUP BY a.id, a.nome, t.nome, p.nome
    -- Incluir apenas alunos que têm pelo menos um alerta OU uma retenção
    HAVING COUNT(ae.id) > 0 OR COUNT(r.id) > 0
  ),
  alunos_com_status AS (
    SELECT 
      acd.*,
      CASE 
        WHEN acd.alertas_ativos >= 3 THEN 'critico'
        WHEN acd.alertas_ativos > 0 THEN 'alerta'
        WHEN acd.total_retencoes > 0 THEN 'retencao'
        ELSE 'normal'
      END as calculated_status
    FROM alunos_com_dados acd
  )
  SELECT 
    acs.id::uuid,
    acs.nome::text,
    acs.turma::text,
    acs.educador::text,
    acs.total_alertas::bigint,
    acs.alertas_ativos::bigint,
    acs.total_retencoes::bigint,
    acs.ultimo_alerta::timestamp with time zone,
    acs.ultima_retencao::timestamp with time zone,
    acs.calculated_status::text
  FROM alunos_com_status acs
  WHERE 
    (p_status_filter = 'todos') OR
    (p_status_filter = 'critico' AND acs.calculated_status = 'critico') OR
    (p_status_filter = 'alerta' AND acs.calculated_status = 'alerta') OR
    (p_status_filter = 'retencao' AND acs.calculated_status = 'retencao') OR
    (p_status_filter = 'normal' AND acs.calculated_status = 'normal')
  ORDER BY 
    CASE acs.calculated_status
      WHEN 'critico' THEN 1
      WHEN 'alerta' THEN 2
      WHEN 'retencao' THEN 3
      ELSE 4
    END,
    acs.nome;
END;
$$;