
-- Buscar todos os lançamentos de março de 2025 para a aluna Amelia
SELECT 
  id,
  data_aula,
  created_at,
  exercicios,
  erros,
  apostila,
  pagina,
  presente,
  fez_desafio,
  comentario,
  is_reposicao,
  motivo_falta,
  aluno_nome
FROM produtividade_abaco 
WHERE pessoa_id = '5477eac1-8a31-4af4-b9fd-45138932817b'
  AND data_aula >= '2025-03-01'
  AND data_aula <= '2025-03-31'
ORDER BY data_aula, created_at;
