-- Adicionar novos valores ao enum user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'financeiro';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'administrativo';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'estagiario';

-- Criar função has_role() para verificação segura de roles em RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.unit_users
    WHERE user_id = _user_id
      AND role = _role
      AND active = true
  )
$$;

-- Comentário para documentação
COMMENT ON FUNCTION public.has_role IS 'Verifica se um usuário possui um role específico. Usa SECURITY DEFINER para evitar recursão em RLS policies.';