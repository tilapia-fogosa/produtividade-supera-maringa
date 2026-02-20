-- Remover políticas RLS atuais da tabela estoque
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar estoque" ON estoque;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir no estoque" ON estoque;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar estoque" ON estoque;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar do estoque" ON estoque;

-- Criar políticas RLS para acesso público (sem autenticação)
CREATE POLICY "Acesso público para visualizar estoque" 
ON estoque 
FOR SELECT 
USING (true);

CREATE POLICY "Acesso público para inserir no estoque" 
ON estoque 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Acesso público para atualizar estoque" 
ON estoque 
FOR UPDATE 
USING (true);

CREATE POLICY "Acesso público para deletar do estoque" 
ON estoque 
FOR DELETE 
USING (true);