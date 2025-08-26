-- Remover a política restritiva existente
DROP POLICY IF EXISTS "Admins podem gerenciar backup de clientes" ON public.clients_backup;

-- Criar nova política mais permissiva para visualização
CREATE POLICY "Usuários autenticados podem visualizar backup de clientes" ON public.clients_backup
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Política para inserção/atualização apenas para admins
CREATE POLICY "Admins podem gerenciar backup de clientes" ON public.clients_backup
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);