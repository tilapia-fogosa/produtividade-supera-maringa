-- Adicionar políticas públicas para alunos
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso público para visualizar alunos" ON public.alunos;
CREATE POLICY "Acesso público para visualizar alunos"
  ON public.alunos
  FOR SELECT
  USING (true);

-- Adicionar políticas públicas para units
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso público para visualizar units" ON public.units;
CREATE POLICY "Acesso público para visualizar units"
  ON public.units
  FOR SELECT
  USING (true);