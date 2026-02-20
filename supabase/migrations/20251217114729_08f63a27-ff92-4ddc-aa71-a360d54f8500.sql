-- 1. REMOVER FOREIGN KEYS de funcionario_registro_id
ALTER TABLE aulas_experimentais 
DROP CONSTRAINT IF EXISTS aulas_experimentais_funcionario_registro_id_fkey;

ALTER TABLE reposicoes 
DROP CONSTRAINT IF EXISTS reposicoes_funcionario_registro_id_fkey;

ALTER TABLE faltas_antecipadas 
DROP CONSTRAINT IF EXISTS faltas_antecipadas_funcionario_registro_id_fkey;

-- 2. ALTERAR CHECK CONSTRAINTS para incluir 'usuario'

-- aulas_experimentais
ALTER TABLE aulas_experimentais 
DROP CONSTRAINT IF EXISTS aulas_experimentais_responsavel_tipo_check;

ALTER TABLE aulas_experimentais 
ADD CONSTRAINT aulas_experimentais_responsavel_tipo_check 
CHECK (responsavel_tipo = ANY (ARRAY['professor'::text, 'funcionario'::text, 'usuario'::text]));

-- reposicoes
ALTER TABLE reposicoes 
DROP CONSTRAINT IF EXISTS reposicoes_responsavel_tipo_check;

ALTER TABLE reposicoes 
ADD CONSTRAINT reposicoes_responsavel_tipo_check 
CHECK (responsavel_tipo = ANY (ARRAY['professor'::text, 'funcionario'::text, 'usuario'::text]));

-- faltas_antecipadas
ALTER TABLE faltas_antecipadas 
DROP CONSTRAINT IF EXISTS faltas_antecipadas_responsavel_aviso_tipo_check;

ALTER TABLE faltas_antecipadas 
ADD CONSTRAINT faltas_antecipadas_responsavel_aviso_tipo_check 
CHECK (responsavel_aviso_tipo = ANY (ARRAY['professor'::text, 'funcionario'::text, 'usuario'::text]));