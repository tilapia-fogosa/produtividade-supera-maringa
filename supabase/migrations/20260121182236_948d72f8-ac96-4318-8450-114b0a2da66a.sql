-- Força o PostgREST a recarregar o schema do banco de dados
-- Isso resolve o erro "column aluno_id does not exist" causado por cache desatualizado
NOTIFY pgrst, 'reload schema';