
-- Criar função SECURITY DEFINER para verificar role do usuário sem recursão
CREATE OR REPLACE FUNCTION public.user_has_role_in_unit(p_user_id uuid, p_unit_id uuid, p_roles user_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.unit_users
    WHERE user_id = p_user_id
      AND unit_id = p_unit_id
      AND active = true
      AND role = ANY(p_roles)
  );
$$;

-- Recriar a policy SELECT sem recursão
DROP POLICY IF EXISTS "unit_users_select" ON public.unit_users;

CREATE POLICY "unit_users_select"
ON public.unit_users
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR is_system_admin()
  OR public.user_has_role_in_unit(auth.uid(), unit_id, ARRAY['franqueado'::user_role, 'admin'::user_role])
);
