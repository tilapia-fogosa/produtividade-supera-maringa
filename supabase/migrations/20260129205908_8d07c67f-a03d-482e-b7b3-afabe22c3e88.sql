-- Habilitar RLS na tabela produtividade_ah
-- A tabela já possui políticas configuradas, apenas precisa ativar o RLS
ALTER TABLE produtividade_ah ENABLE ROW LEVEL SECURITY;