-- Remover políticas RLS existentes para faltas_antecipadas
DROP POLICY IF EXISTS "Users can create faltas antecipadas" ON faltas_antecipadas;
DROP POLICY IF EXISTS "Users can view faltas antecipadas" ON faltas_antecipadas;
DROP POLICY IF EXISTS "Users can update faltas antecipadas" ON faltas_antecipadas;
DROP POLICY IF EXISTS "Users can delete faltas antecipadas" ON faltas_antecipadas;

-- Criar novas políticas que permitem acesso público (sem autenticação)
CREATE POLICY "Acesso público para visualizar faltas antecipadas" 
ON faltas_antecipadas 
FOR SELECT 
USING (true);

CREATE POLICY "Acesso público para inserir faltas antecipadas" 
ON faltas_antecipadas 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Acesso público para atualizar faltas antecipadas" 
ON faltas_antecipadas 
FOR UPDATE 
USING (true);

CREATE POLICY "Acesso público para deletar faltas antecipadas" 
ON faltas_antecipadas 
FOR DELETE 
USING (true);