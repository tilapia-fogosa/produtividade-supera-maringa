-- Criar views unificadas para evitar joins client-side e garantir active = true

-- View para Corretores (professores + estagiários)
CREATE VIEW corretores_view AS
SELECT 
  id, 
  nome, 
  'professor' as tipo,
  unit_id,
  true as active
FROM professores 
WHERE status = true

UNION ALL

SELECT 
  id, 
  nome, 
  'estagiario' as tipo,
  unit_id,
  active
FROM funcionarios 
WHERE active = true AND cargo = 'Estagiário';

-- View para Responsáveis (professores + funcionários exceto cargos específicos)
CREATE VIEW responsaveis_view AS
SELECT 
  id, 
  nome, 
  'professor' as tipo,
  unit_id,
  true as active
FROM professores 
WHERE status = true

UNION ALL

SELECT 
  id, 
  nome, 
  'funcionario' as tipo,
  unit_id,
  active
FROM funcionarios 
WHERE active = true 
AND cargo NOT IN ('Filha', 'familiar');

-- View para Pessoas da Turma (alunos + funcionários)
CREATE VIEW pessoas_turma_view AS
SELECT 
  id, nome, email, telefone, turma_id, active, unit_id,
  codigo, ultimo_nivel, ultima_pagina, niveldesafio, 
  ultima_correcao_ah, data_onboarding,
  'aluno' as origem,
  null as cargo,
  idade, dias_supera
FROM alunos 
WHERE active = true

UNION ALL

SELECT 
  id, nome, email, telefone, turma_id, active, unit_id,
  codigo, ultimo_nivel, ultima_pagina, niveldesafio,
  ultima_correcao_ah, data_onboarding,
  'funcionario' as origem,
  cargo,
  idade, dias_supera
FROM funcionarios 
WHERE active = true;

-- Função para buscar pessoas de uma turma específica com último registro
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

-- Função para buscar todas as pessoas (alunos + funcionários) ativas
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

-- Função para verificar se pessoa existe (para edge functions)
CREATE OR REPLACE FUNCTION verificar_pessoa_existe(p_pessoa_id UUID)
RETURNS TABLE(
  id UUID,
  tipo TEXT,
  nome TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, 'aluno'::TEXT as tipo, a.nome
  FROM alunos a 
  WHERE a.id = p_pessoa_id AND a.active = true
  
  UNION ALL
  
  SELECT f.id, 'funcionario'::TEXT as tipo, f.nome
  FROM funcionarios f 
  WHERE f.id = p_pessoa_id AND f.active = true;
END;
$$;