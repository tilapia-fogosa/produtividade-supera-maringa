-- Habilitar RLS na tabela eventos_professor
ALTER TABLE eventos_professor ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública
CREATE POLICY "Acesso público para visualizar eventos professor"
ON eventos_professor
FOR SELECT
USING (true);

-- Política para permitir inserção pública
CREATE POLICY "Acesso público para inserir eventos professor"
ON eventos_professor
FOR INSERT
WITH CHECK (true);

-- Política para permitir atualização pública
CREATE POLICY "Acesso público para atualizar eventos professor"
ON eventos_professor
FOR UPDATE
USING (true);

-- Política para permitir exclusão pública
CREATE POLICY "Acesso público para deletar eventos professor"
ON eventos_professor
FOR DELETE
USING (true);