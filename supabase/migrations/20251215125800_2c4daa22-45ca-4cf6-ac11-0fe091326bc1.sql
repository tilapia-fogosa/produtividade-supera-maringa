-- =============================================
-- RLS MÓDULO PEDAGÓGICO
-- Regra: Usuários autenticados têm acesso total
-- Usuários não autenticados são bloqueados
-- =============================================

-- TABELA: alunos
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users have full access to alunos" ON public.alunos;
CREATE POLICY "Authenticated users have full access to alunos"
ON public.alunos
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- TABELA: turmas
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users have full access to turmas" ON public.turmas;
CREATE POLICY "Authenticated users have full access to turmas"
ON public.turmas
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- TABELA: professores
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users have full access to professores" ON public.professores;
CREATE POLICY "Authenticated users have full access to professores"
ON public.professores
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- TABELA: funcionarios
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users have full access to funcionarios" ON public.funcionarios;
CREATE POLICY "Authenticated users have full access to funcionarios"
ON public.funcionarios
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- TABELA: produtividade_abaco
ALTER TABLE public.produtividade_abaco ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users have full access to produtividade_abaco" ON public.produtividade_abaco;
CREATE POLICY "Authenticated users have full access to produtividade_abaco"
ON public.produtividade_abaco
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);