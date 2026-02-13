-- Atualizar policy de SELECT em unit_users para permitir que
-- franqueados e admins vejam os usuários da mesma unidade
DROP POLICY IF EXISTS "unit_users_select" ON public.unit_users;

CREATE POLICY "unit_users_select" ON public.unit_users
FOR SELECT TO authenticated
USING (
  -- Usuário pode ver seus próprios registros
  user_id = auth.uid()
  -- Ou é admin do sistema
  OR is_system_admin()
  -- Ou é franqueado/admin na mesma unidade
  OR EXISTS (
    SELECT 1 FROM public.unit_users AS my_units
    WHERE my_units.user_id = auth.uid()
      AND my_units.unit_id = unit_users.unit_id
      AND my_units.active = true
      AND my_units.role IN ('franqueado', 'admin')
  )
);