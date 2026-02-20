-- Criar política de SELECT para grupos_sup_mga
CREATE POLICY "grupos_sup_mga_select" ON grupos_sup_mga
FOR SELECT TO authenticated
USING (true);

-- Criar política de INSERT para grupos_sup_mga
CREATE POLICY "grupos_sup_mga_insert" ON grupos_sup_mga
FOR INSERT TO authenticated
WITH CHECK (true);

-- Criar política de UPDATE para grupos_sup_mga
CREATE POLICY "grupos_sup_mga_update" ON grupos_sup_mga
FOR UPDATE TO authenticated
USING (true);

-- Criar política de DELETE para grupos_sup_mga
CREATE POLICY "grupos_sup_mga_delete" ON grupos_sup_mga
FOR DELETE TO authenticated
USING (true);