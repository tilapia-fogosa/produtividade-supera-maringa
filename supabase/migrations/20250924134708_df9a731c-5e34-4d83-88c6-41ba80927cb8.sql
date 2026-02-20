-- Remove a política restritiva atual da tabela data_imports
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar importações de suas u" ON data_imports;

-- Adiciona política de acesso público para leitura da tabela data_imports
CREATE POLICY "Permitir leitura pública das importações" 
ON data_imports 
FOR SELECT 
USING (true);

-- Adiciona política de inserção pública (para Edge Functions)
CREATE POLICY "Permitir inserção pública das importações" 
ON data_imports 
FOR INSERT 
WITH CHECK (true);

-- Adiciona política de atualização pública (para Edge Functions)
CREATE POLICY "Permitir atualização pública das importações" 
ON data_imports 
FOR UPDATE 
USING (true);