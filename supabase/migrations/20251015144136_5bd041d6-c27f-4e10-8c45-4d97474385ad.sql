-- Filtrar turmas de projeto do Abrindo Horizontes
-- Atualizar view pessoas_turma_view para excluir alunos/funcionários de turmas com projeto = true

DROP VIEW IF EXISTS pessoas_turma_view CASCADE;

CREATE VIEW pessoas_turma_view AS
-- Alunos (excluindo turmas com projeto = true)
SELECT 
  id, nome, email, telefone, turma_id, active, unit_id,
  codigo, ultimo_nivel, ultima_pagina, niveldesafio, 
  ultima_correcao_ah, data_onboarding,
  'aluno' as origem,
  null as cargo,
  idade, dias_supera
FROM alunos 
WHERE active = true
  AND (
    turma_id IS NULL 
    OR turma_id IN (
      SELECT id FROM turmas WHERE projeto IS NOT TRUE
    )
  )

UNION ALL

-- Funcionários (excluindo turmas com projeto = true)
SELECT 
  id, nome, email, telefone, turma_id, active, unit_id,
  codigo, ultimo_nivel, ultima_pagina, niveldesafio,
  ultima_correcao_ah, data_onboarding,
  'funcionario' as origem,
  cargo,
  idade, dias_supera
FROM funcionarios 
WHERE active = true
  AND (
    turma_id IS NULL 
    OR turma_id IN (
      SELECT id FROM turmas WHERE projeto IS NOT TRUE
    )
  );

-- Recriar função get_todas_pessoas (depende da view)
CREATE OR REPLACE FUNCTION get_todas_pessoas()
RETURNS TABLE(
  id UUID,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  turma_id UUID,
  turma_nome TEXT,
  origem TEXT,
  cargo TEXT,
  ultima_correcao_ah TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ptv.id,
    ptv.nome,
    ptv.email,
    ptv.telefone,
    ptv.turma_id,
    t.nome as turma_nome,
    ptv.origem,
    ptv.cargo,
    ptv.ultima_correcao_ah
  FROM pessoas_turma_view ptv
  LEFT JOIN turmas t ON ptv.turma_id = t.id
  ORDER BY ptv.nome;
END;
$$;

-- Recriar função get_pessoas_turma (depende da view)
CREATE OR REPLACE FUNCTION get_pessoas_turma(p_turma_id UUID)
RETURNS TABLE(
  id UUID,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  origem TEXT,
  cargo TEXT,
  idade INTEGER,
  dias_supera INTEGER,
  ultimo_registro_data DATE,
  ultimo_registro_id UUID
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ptv.id,
    ptv.nome,
    ptv.email,
    ptv.telefone,
    ptv.origem,
    ptv.cargo,
    ptv.idade,
    ptv.dias_supera,
    pa.data_aula,
    pa.id
  FROM pessoas_turma_view ptv
  LEFT JOIN LATERAL (
    SELECT id, data_aula
    FROM produtividade_abaco 
    WHERE aluno_id = ptv.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) pa ON true
  WHERE ptv.turma_id = p_turma_id
  ORDER BY ptv.nome;
END;
$$;