
-- Função para verificar se usuário é admin do SISTEMA (via profiles.is_admin)
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Função para obter o role do usuário em uma unidade específica
CREATE OR REPLACE FUNCTION public.get_user_role_in_unit(p_unit_id uuid)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.unit_users
  WHERE user_id = auth.uid()
    AND unit_id = p_unit_id
    AND active = true
  LIMIT 1;
$$;

-- Função para obter todas as unidades do usuário
CREATE OR REPLACE FUNCTION public.get_user_unit_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    array_agg(unit_id),
    '{}'::uuid[]
  )
  FROM public.unit_users
  WHERE user_id = auth.uid()
    AND active = true;
$$;

-- Função para verificar se usuário tem acesso a uma unidade
CREATE OR REPLACE FUNCTION public.has_unit_access(p_unit_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_system_admin() 
    OR EXISTS (
      SELECT 1 FROM public.unit_users
      WHERE user_id = auth.uid()
        AND unit_id = p_unit_id
        AND active = true
    );
$$;

-- ============================================
-- RLS para unit_users
-- ============================================
ALTER TABLE public.unit_users ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seus próprios registros
DROP POLICY IF EXISTS "Users can view own unit_users" ON public.unit_users;
CREATE POLICY "Users can view own unit_users"
  ON public.unit_users
  FOR SELECT
  USING (user_id = auth.uid() OR public.is_system_admin());

-- Apenas admin do sistema pode inserir
DROP POLICY IF EXISTS "System admins can insert unit_users" ON public.unit_users;
CREATE POLICY "System admins can insert unit_users"
  ON public.unit_users
  FOR INSERT
  WITH CHECK (public.is_system_admin());

-- Apenas admin do sistema pode atualizar
DROP POLICY IF EXISTS "System admins can update unit_users" ON public.unit_users;
CREATE POLICY "System admins can update unit_users"
  ON public.unit_users
  FOR UPDATE
  USING (public.is_system_admin());

-- Apenas admin do sistema pode deletar
DROP POLICY IF EXISTS "System admins can delete unit_users" ON public.unit_users;
CREATE POLICY "System admins can delete unit_users"
  ON public.unit_users
  FOR DELETE
  USING (public.is_system_admin());

-- ============================================
-- RLS para profiles
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seu próprio perfil, admins veem todos
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (id = auth.uid() OR public.is_system_admin());

-- Usuários podem atualizar seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid());

-- Apenas admin do sistema pode inserir novos perfis
DROP POLICY IF EXISTS "System admins can insert profiles" ON public.profiles;
CREATE POLICY "System admins can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (public.is_system_admin());
