-- Adicionar coluna foto_devolutiva_url na tabela alunos
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS foto_devolutiva_url TEXT;

-- Adicionar coluna foto_devolutiva_url na tabela funcionarios
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS foto_devolutiva_url TEXT;

-- Comentários explicativos
COMMENT ON COLUMN alunos.foto_devolutiva_url IS 'URL da foto usada especificamente na devolutiva de fim de ano';
COMMENT ON COLUMN funcionarios.foto_devolutiva_url IS 'URL da foto usada especificamente na devolutiva de fim de ano';