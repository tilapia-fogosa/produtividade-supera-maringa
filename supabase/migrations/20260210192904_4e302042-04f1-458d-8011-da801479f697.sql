CREATE OR REPLACE FUNCTION public.user_has_access_to_unit(unit_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.unit_users uu
    WHERE uu.user_id = auth.uid()
      AND (uu.unit_id = user_has_access_to_unit.unit_id OR uu.role = 'admin')
      AND uu.active = true
  );
END;
$$;