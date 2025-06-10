
-- Corrigir a data_aula do registro que foi lançado no dia errado
UPDATE produtividade_abaco 
SET data_aula = '2025-05-07'
WHERE id = 'bcf879d1-6e0d-4c95-91de-aa420bb58165'
  AND data_aula = '2025-04-25'
  AND pessoa_id = '5477eac1-8a31-4af4-b9fd-45138932817b';

-- Verificar se a correção foi aplicada
SELECT 
  id,
  data_aula,
  created_at,
  exercicios,
  erros,
  apostila,
  presente
FROM produtividade_abaco 
WHERE pessoa_id = '5477eac1-8a31-4af4-b9fd-45138932817b'
  AND (data_aula = '2025-04-25' OR data_aula = '2025-05-07')
ORDER BY data_aula, created_at;
