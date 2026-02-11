
CREATE OR REPLACE FUNCTION public.get_apostilas_recolhidas_por_unidade(p_unit_id UUID)
RETURNS TABLE (
  id TEXT,
  pessoa_nome TEXT,
  turma_nome TEXT,
  apostila TEXT,
  data_recolhida TIMESTAMPTZ,
  data_entrega TIMESTAMPTZ,
  pessoa_id UUID,
  total_correcoes BIGINT,
  exercicios_corrigidos BIGINT,
  erros BIGINT,
  data_entrega_real TIMESTAMPTZ,
  responsavel_entrega_nome TEXT,
  foi_entregue BOOLEAN,
  correcao_iniciada BOOLEAN,
  responsavel_correcao_nome TEXT,
  responsavel_correcao_tipo TEXT,
  data_inicio_correcao TIMESTAMPTZ,
  professor_id UUID,
  professor_nome TEXT,
  origem TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  -- Alunos
  SELECT
    r.id::TEXT,
    a.nome::TEXT AS pessoa_nome,
    COALESCE(t.nome, 'Sem turma')::TEXT AS turma_nome,
    r.apostila::TEXT,
    r.created_at AS data_recolhida,
    (r.created_at + INTERVAL '14 days') AS data_entrega,
    r.pessoa_id,
    COALESCE(cor.total_correcoes, 0)::BIGINT,
    COALESCE(cor.exercicios_corrigidos, 0)::BIGINT,
    COALESCE(cor.erros, 0)::BIGINT,
    r.data_entrega_real,
    r.responsavel_entrega_nome::TEXT,
    (r.data_entrega_real IS NOT NULL) AS foi_entregue,
    COALESCE(r.correcao_iniciada, false) AS correcao_iniciada,
    r.responsavel_correcao_nome::TEXT,
    r.responsavel_correcao_tipo::TEXT,
    r.data_inicio_correcao,
    t.professor_id,
    COALESCE(p.nome, 'Sem professor')::TEXT AS professor_nome,
    'aluno'::TEXT AS origem
  FROM ah_recolhidas r
  INNER JOIN alunos a ON a.id = r.pessoa_id AND a.unit_id = p_unit_id
  LEFT JOIN turmas t ON t.id = a.turma_id
  LEFT JOIN professores p ON p.id = t.professor_id
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::BIGINT AS total_correcoes,
      COALESCE(SUM(pa.exercicios), 0)::BIGINT AS exercicios_corrigidos,
      COALESCE(SUM(pa.erros), 0)::BIGINT AS erros
    FROM produtividade_ah pa
    WHERE pa.ah_recolhida_id = r.id
  ) cor ON true

  UNION ALL

  -- Funcionários
  SELECT
    r.id::TEXT,
    f.nome::TEXT AS pessoa_nome,
    COALESCE(t.nome, 'Sem turma')::TEXT AS turma_nome,
    r.apostila::TEXT,
    r.created_at AS data_recolhida,
    (r.created_at + INTERVAL '14 days') AS data_entrega,
    r.pessoa_id,
    COALESCE(cor.total_correcoes, 0)::BIGINT,
    COALESCE(cor.exercicios_corrigidos, 0)::BIGINT,
    COALESCE(cor.erros, 0)::BIGINT,
    r.data_entrega_real,
    r.responsavel_entrega_nome::TEXT,
    (r.data_entrega_real IS NOT NULL) AS foi_entregue,
    COALESCE(r.correcao_iniciada, false) AS correcao_iniciada,
    r.responsavel_correcao_nome::TEXT,
    r.responsavel_correcao_tipo::TEXT,
    r.data_inicio_correcao,
    t.professor_id,
    COALESCE(p.nome, 'Sem professor')::TEXT AS professor_nome,
    'funcionario'::TEXT AS origem
  FROM ah_recolhidas r
  INNER JOIN funcionarios f ON f.id = r.pessoa_id AND f.unit_id = p_unit_id
  LEFT JOIN turmas t ON t.id = f.turma_id
  LEFT JOIN professores p ON p.id = t.professor_id
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::BIGINT AS total_correcoes,
      COALESCE(SUM(pa.exercicios), 0)::BIGINT AS exercicios_corrigidos,
      COALESCE(SUM(pa.erros), 0)::BIGINT AS erros
    FROM produtividade_ah pa
    WHERE pa.ah_recolhida_id = r.id
  ) cor ON true

  ORDER BY data_recolhida DESC;
END;
$$;
