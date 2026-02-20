-- Remover coluna aniversario_mes_dia existente da tabela alunos
ALTER TABLE alunos DROP COLUMN IF EXISTS aniversario_mes_dia;

-- Adicionar nova coluna aniversario_mes_dia com formato DD/MM
ALTER TABLE alunos 
ADD COLUMN aniversario_mes_dia TEXT 
GENERATED ALWAYS AS (
  CASE 
    WHEN (data_nascimento IS NOT NULL) 
    THEN ((LPAD((EXTRACT(day FROM data_nascimento))::text, 2, '0'::text) || '/'::text) || LPAD((EXTRACT(month FROM data_nascimento))::text, 2, '0'::text))
    ELSE NULL::text
  END
) STORED;

-- Criar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_alunos_aniversario 
ON alunos(aniversario_mes_dia) 
WHERE aniversario_mes_dia IS NOT NULL;

-- Remover coluna aniversario_mes_dia existente da tabela funcionarios
ALTER TABLE funcionarios DROP COLUMN IF EXISTS aniversario_mes_dia;

-- Adicionar nova coluna aniversario_mes_dia com formato DD/MM
ALTER TABLE funcionarios 
ADD COLUMN aniversario_mes_dia TEXT 
GENERATED ALWAYS AS (
  CASE 
    WHEN (data_nascimento IS NOT NULL) 
    THEN ((LPAD((EXTRACT(day FROM data_nascimento))::text, 2, '0'::text) || '/'::text) || LPAD((EXTRACT(month FROM data_nascimento))::text, 2, '0'::text))
    ELSE NULL::text
  END
) STORED;

-- Criar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_funcionarios_aniversario 
ON funcionarios(aniversario_mes_dia) 
WHERE aniversario_mes_dia IS NOT NULL;