
CREATE TABLE public.comissao_metas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL CHECK (mes >= 0 AND mes <= 11),
  ano INTEGER NOT NULL,
  valor_meta NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(unit_id, mes, ano)
);

ALTER TABLE public.comissao_metas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view metas of their unit"
ON public.comissao_metas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Franqueados and admins can insert metas"
ON public.comissao_metas FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Franqueados and admins can update metas"
ON public.comissao_metas FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Franqueados and admins can delete metas"
ON public.comissao_metas FOR DELETE
TO authenticated
USING (true);
