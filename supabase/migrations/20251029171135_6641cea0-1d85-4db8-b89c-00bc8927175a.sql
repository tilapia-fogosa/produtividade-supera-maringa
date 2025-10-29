-- Adicionar coluna prioridade na tabela professores
ALTER TABLE professores 
ADD COLUMN IF NOT EXISTS prioridade integer;

-- Atualizar prioridade existente baseado no ID (ordem alfabética por padrão)
WITH professores_ordenados AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY nome) as nova_prioridade
  FROM professores
  WHERE status = true
)
UPDATE professores
SET prioridade = professores_ordenados.nova_prioridade
FROM professores_ordenados
WHERE professores.id = professores_ordenados.id;