-- Política para admins poderem visualizar todos os registros de ponto
CREATE POLICY "Admins podem ver todos os registros de ponto"
ON public.registro_ponto
FOR SELECT
USING (public.is_system_admin());

-- Política para admins poderem atualizar registros de ponto
CREATE POLICY "Admins podem atualizar registros de ponto"
ON public.registro_ponto
FOR UPDATE
USING (public.is_system_admin());

-- Política para admins poderem excluir registros de ponto
CREATE POLICY "Admins podem excluir registros de ponto"
ON public.registro_ponto
FOR DELETE
USING (public.is_system_admin());