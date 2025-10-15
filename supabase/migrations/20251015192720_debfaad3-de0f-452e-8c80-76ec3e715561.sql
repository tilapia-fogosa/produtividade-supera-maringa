-- Adicionar campos para controle de ignorar coletas AH na tabela alunos
ALTER TABLE alunos 
ADD COLUMN IF NOT EXISTS ah_ignorar_ate timestamp with time zone,
ADD COLUMN IF NOT EXISTS ah_ignorar_motivo text,
ADD COLUMN IF NOT EXISTS ah_ignorar_responsavel text;

COMMENT ON COLUMN alunos.ah_ignorar_ate IS 'Data até quando o aluno deve ser ignorado da lista de próximas coletas AH';
COMMENT ON COLUMN alunos.ah_ignorar_motivo IS 'Motivo pelo qual o aluno está sendo ignorado temporariamente';
COMMENT ON COLUMN alunos.ah_ignorar_responsavel IS 'Nome do responsável que registrou o período de ignorar';