
-- Atribuir professor_responsavel_id para TODAS as atividades pendentes sem professor
-- baseando-se no professor atual da turma do aluno

UPDATE atividades_alerta_evasao aae
SET professor_responsavel_id = p.id
FROM alerta_evasao ae
JOIN alunos a ON ae.aluno_id = a.id
JOIN turmas t ON a.turma_id = t.id
JOIN professores p ON t.professor_id = p.id
WHERE aae.alerta_evasao_id = ae.id
  AND aae.professor_responsavel_id IS NULL
  AND aae.departamento_responsavel IS NULL  -- Não atribuir professor para atividades administrativas
  AND p.id IS NOT NULL
  AND aae.status = 'pendente';

-- Log para verificar quantas foram atualizadas
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM atividades_alerta_evasao
  WHERE professor_responsavel_id IS NOT NULL
    AND status = 'pendente';
  
  RAISE NOTICE 'Total de atividades pendentes com professor atribuído: %', updated_count;
END $$;
