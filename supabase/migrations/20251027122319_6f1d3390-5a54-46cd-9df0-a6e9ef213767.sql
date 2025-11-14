-- Criar view com alunos do Projeto São Rafael
CREATE OR REPLACE VIEW alunos_projeto_sao_rafael AS
SELECT 
  a.id,
  a.nome,
  a.turma_id,
  t.nome as turma_nome,
  a.ultima_correcao_ah,
  a.active
FROM alunos a
LEFT JOIN turmas t ON a.turma_id = t.id
WHERE a.turma_id IN (
  'e872a70f-b99c-4f14-807e-32b55d592e79',
  'd86f55b5-2018-476c-ac0b-6ea9c03e7d0b'
)
AND a.active = true
ORDER BY a.nome;

-- Permitir leitura pública da view
GRANT SELECT ON alunos_projeto_sao_rafael TO anon, authenticated;