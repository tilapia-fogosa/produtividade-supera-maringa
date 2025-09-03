-- Função RPC otimizada para buscar alunos com histórico de retenções e alertas
CREATE OR REPLACE FUNCTION get_alunos_retencoes_historico(
  p_search_term TEXT DEFAULT '',
  p_status_filter TEXT DEFAULT 'todos'
) RETURNS TABLE (
  id UUID,
  nome TEXT,
  turma TEXT,
  educador TEXT,
  total_alertas BIGINT,
  alertas_ativos BIGINT,
  total_retencoes BIGINT,
  ultimo_alerta TIMESTAMPTZ,
  ultima_retencao TIMESTAMPTZ,
  status TEXT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH alunos_com_historico AS (
    SELECT 
      a.id,
      a.nome,
      COALESCE(t.nome, 'Sem turma') as turma,
      COALESCE(p.nome, 'Sem professor') as educador,
      COUNT(ae.id) as total_alertas,
      COUNT(ae.id) FILTER (WHERE ae.status = 'pendente') as alertas_ativos,
      COUNT(r.id) as total_retencoes,
      MAX(ae.created_at) as ultimo_alerta,
      MAX(r.created_at) as ultima_retencao
    FROM alunos a
    LEFT JOIN turmas t ON a.turma_id = t.id
    LEFT JOIN professores p ON t.professor_id = p.id
    LEFT JOIN alerta_evasao ae ON a.id = ae.aluno_id
    LEFT JOIN retencoes r ON a.id = r.aluno_id
    WHERE a.active = true
      AND (p_search_term = '' OR a.nome ILIKE '%' || p_search_term || '%')
    GROUP BY a.id, a.nome, t.nome, p.nome
    HAVING COUNT(ae.id) > 0 OR COUNT(r.id) > 0  -- Só alunos com alertas ou retenções
  ),
  alunos_com_status AS (
    SELECT 
      ach.*,
      CASE 
        WHEN ach.alertas_ativos >= 2 THEN 'critico'
        WHEN ach.alertas_ativos > 0 THEN 'alerta'
        WHEN ach.total_retencoes > 0 THEN 'retencao'
        ELSE 'normal'
      END as calculated_status
    FROM alunos_com_historico ach
  )
  SELECT 
    acs.id,
    acs.nome,
    acs.turma,
    acs.educador,
    acs.total_alertas,
    acs.alertas_ativos,
    acs.total_retencoes,
    acs.ultimo_alerta,
    acs.ultima_retencao,
    acs.calculated_status as status
  FROM alunos_com_status acs
  WHERE 
    CASE p_status_filter
      WHEN 'todos' THEN true
      WHEN 'alertas-ativos' THEN acs.alertas_ativos > 0
      WHEN 'com-retencoes' THEN acs.total_retencoes > 0
      WHEN 'criticos' THEN acs.calculated_status = 'critico'
      ELSE true
    END
  ORDER BY 
    CASE acs.calculated_status
      WHEN 'critico' THEN 1
      WHEN 'alerta' THEN 2
      WHEN 'retencao' THEN 3
      ELSE 4
    END,
    acs.nome ASC;
END;
$$;