-- Adicionar política de UPDATE para funcionarios
CREATE POLICY "Acesso público para atualizar funcionarios"
ON public.funcionarios
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Adicionar política de INSERT para funcionarios (caso precise)
CREATE POLICY "Acesso público para inserir funcionarios"
ON public.funcionarios
FOR INSERT
TO public
WITH CHECK (true);