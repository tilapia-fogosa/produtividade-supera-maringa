
-- Tabela para armazenar a fórmula de comissão por unidade
CREATE TABLE public.comissao_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  formula_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  formula_display TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(unit_id)
);

-- Enable RLS
ALTER TABLE public.comissao_config ENABLE ROW LEVEL SECURITY;

-- Leitura: qualquer autenticado da unidade
CREATE POLICY "Users can read comissao_config for their unit"
ON public.comissao_config
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.unit_users
    WHERE unit_users.user_id = auth.uid()
      AND unit_users.unit_id = comissao_config.unit_id
      AND unit_users.active = true
  )
);

-- Insert/Update: apenas franqueado e admin
CREATE POLICY "Franqueado and admin can insert comissao_config"
ON public.comissao_config
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.unit_users
    WHERE unit_users.user_id = auth.uid()
      AND unit_users.unit_id = comissao_config.unit_id
      AND unit_users.active = true
      AND unit_users.role IN ('franqueado', 'admin')
  )
);

CREATE POLICY "Franqueado and admin can update comissao_config"
ON public.comissao_config
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.unit_users
    WHERE unit_users.user_id = auth.uid()
      AND unit_users.unit_id = comissao_config.unit_id
      AND unit_users.active = true
      AND unit_users.role IN ('franqueado', 'admin')
  )
);
