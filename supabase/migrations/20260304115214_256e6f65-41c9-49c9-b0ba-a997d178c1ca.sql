-- Política INSERT para clients: admins, sdrs e consultores podem inserir
CREATE POLICY "Users with access can insert clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (user_has_access_to_unit(unit_id));

-- Política UPDATE para clients
CREATE POLICY "Users with access can update clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (user_has_access_to_unit(unit_id))
WITH CHECK (user_has_access_to_unit(unit_id));

-- Política DELETE para clients
CREATE POLICY "Users with access can delete clients"
ON public.clients
FOR DELETE
TO authenticated
USING (user_has_access_to_unit(unit_id));