-- Adicionar coluna computada aniversario_mes_dia na tabela alunos
-- Usando EXTRACT que é uma função imutável
ALTER TABLE alunos 
ADD COLUMN aniversario_mes_dia TEXT 
GENERATED ALWAYS AS (
  CASE 
    WHEN data_nascimento IS NOT NULL 
    THEN LPAD(EXTRACT(MONTH FROM data_nascimento)::text, 2, '0') || '-' || LPAD(EXTRACT(DAY FROM data_nascimento)::text, 2, '0')
    ELSE NULL
  END
) STORED;

-- Criar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_alunos_aniversario 
ON alunos(aniversario_mes_dia) 
WHERE aniversario_mes_dia IS NOT NULL;

-- Adicionar coluna computada aniversario_mes_dia na tabela funcionarios
ALTER TABLE funcionarios 
ADD COLUMN aniversario_mes_dia TEXT 
GENERATED ALWAYS AS (
  CASE 
    WHEN data_nascimento IS NOT NULL 
    THEN LPAD(EXTRACT(MONTH FROM data_nascimento)::text, 2, '0') || '-' || LPAD(EXTRACT(DAY FROM data_nascimento)::text, 2, '0')
    ELSE NULL
  END
) STORED;

-- Criar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_funcionarios_aniversario 
ON funcionarios(aniversario_mes_dia) 
WHERE aniversario_mes_dia IS NOT NULL;