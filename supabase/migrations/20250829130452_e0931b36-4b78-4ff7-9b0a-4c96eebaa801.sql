-- Primeiro, vamos adicionar uma nova coluna para identificar se é aluno ou funcionário
ALTER TABLE reposicoes ADD COLUMN pessoa_tipo TEXT DEFAULT 'aluno';

-- Adicionar uma coluna pessoa_id que será usada para referenciar tanto alunos quanto funcionários
ALTER TABLE reposicoes ADD COLUMN pessoa_id UUID;

-- Preencher pessoa_id com os valores atuais de aluno_id
UPDATE reposicoes SET pessoa_id = aluno_id WHERE aluno_id IS NOT NULL;

-- Remover a constraint de foreign key atual
ALTER TABLE reposicoes DROP CONSTRAINT IF EXISTS reposicoes_aluno_id_fkey;

-- Tornar a coluna aluno_id opcional
ALTER TABLE reposicoes ALTER COLUMN aluno_id DROP NOT NULL;

-- Adicionar constraint para garantir que pessoa_id não seja nulo
ALTER TABLE reposicoes ALTER COLUMN pessoa_id SET NOT NULL;

-- Adicionar um comentário explicativo
COMMENT ON COLUMN reposicoes.pessoa_tipo IS 'Indica se a reposição é para um aluno ou funcionário';
COMMENT ON COLUMN reposicoes.pessoa_id IS 'ID da pessoa (aluno ou funcionário) que fará a reposição';