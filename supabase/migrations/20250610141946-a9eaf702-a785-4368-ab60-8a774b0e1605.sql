
-- Atualizar dados dos alunos com base nos últimos lançamentos de produtividade

-- 1. Atualizar último nível (apostila) e última página do ábaco
WITH ultimo_abaco AS (
  SELECT DISTINCT ON (pessoa_id) 
    pessoa_id,
    apostila as ultimo_nivel,
    CASE 
      WHEN pagina ~ '^[0-9]+$' THEN pagina::integer 
      ELSE NULL 
    END as ultima_pagina
  FROM produtividade_abaco 
  WHERE tipo_pessoa = 'aluno' 
    AND presente = true 
    AND apostila IS NOT NULL
    AND data_aula IS NOT NULL
  ORDER BY pessoa_id, data_aula DESC, created_at DESC
)
UPDATE alunos 
SET 
  ultimo_nivel = ua.ultimo_nivel,
  ultima_pagina = ua.ultima_pagina
FROM ultimo_abaco ua
WHERE alunos.id = ua.pessoa_id;

-- 2. Atualizar última correção AH
WITH ultima_correcao AS (
  SELECT DISTINCT ON (pessoa_id)
    pessoa_id,
    created_at as ultima_correcao_ah
  FROM produtividade_ah 
  WHERE tipo_pessoa = 'aluno'
    AND created_at IS NOT NULL
  ORDER BY pessoa_id, created_at DESC
)
UPDATE alunos 
SET ultima_correcao_ah = uc.ultima_correcao_ah
FROM ultima_correcao uc
WHERE alunos.id = uc.pessoa_id;

-- 3. Atualizar última falta (opcional, caso tenha perdido esse dado também)
WITH ultima_falta AS (
  SELECT DISTINCT ON (pessoa_id)
    pessoa_id,
    data_aula as ultima_falta
  FROM produtividade_abaco 
  WHERE tipo_pessoa = 'aluno' 
    AND presente = false
    AND data_aula IS NOT NULL
  ORDER BY pessoa_id, data_aula DESC
)
UPDATE alunos 
SET ultima_falta = uf.ultima_falta
FROM ultima_falta uf
WHERE alunos.id = uf.pessoa_id;

-- Verificar os resultados
SELECT 
  nome,
  ultimo_nivel,
  ultima_pagina,
  ultima_correcao_ah,
  ultima_falta
FROM alunos 
WHERE ultimo_nivel IS NOT NULL 
   OR ultima_pagina IS NOT NULL 
   OR ultima_correcao_ah IS NOT NULL
ORDER BY nome
LIMIT 10;
