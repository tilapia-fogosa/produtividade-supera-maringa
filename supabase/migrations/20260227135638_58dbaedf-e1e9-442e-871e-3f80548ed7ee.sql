CREATE OR REPLACE VIEW public.alunos_projeto_sao_rafael AS
SELECT a.id,
    a.nome,
    a.turma_id,
    t.nome AS turma_nome,
    a.ultima_correcao_ah,
    a.active
   FROM alunos a
     LEFT JOIN turmas t ON a.turma_id = t.id
  WHERE t.is_projeto = true
  ORDER BY a.nome;