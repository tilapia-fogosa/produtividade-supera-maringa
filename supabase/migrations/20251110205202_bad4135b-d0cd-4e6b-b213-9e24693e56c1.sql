-- Remover políticas antigas restritivas de devolutivas_controle
DROP POLICY IF EXISTS "Usuários podem ver devolutivas de sua unidade" ON public.devolutivas_controle;
DROP POLICY IF EXISTS "Usuários podem atualizar devolutivas de sua unidade" ON public.devolutivas_controle;
DROP POLICY IF EXISTS "Usuários podem inserir devolutivas de sua unidade" ON public.devolutivas_controle;

-- Criar políticas públicas para devolutivas_controle
CREATE POLICY "Acesso público para visualizar devolutivas"
  ON public.devolutivas_controle
  FOR SELECT
  USING (true);

CREATE POLICY "Acesso público para atualizar devolutivas"
  ON public.devolutivas_controle
  FOR UPDATE
  USING (true);

CREATE POLICY "Acesso público para inserir devolutivas"
  ON public.devolutivas_controle
  FOR INSERT
  WITH CHECK (true);

-- Habilitar RLS e criar política pública para funcionarios
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso público para visualizar funcionarios"
  ON public.funcionarios
  FOR SELECT
  USING (true);

-- Garantir acesso público para turmas (caso não exista)
DROP POLICY IF EXISTS "Acesso público para visualizar turmas" ON public.turmas;
CREATE POLICY "Acesso público para visualizar turmas"
  ON public.turmas
  FOR SELECT
  USING (true);

-- Garantir acesso público para professores (caso não exista)
DROP POLICY IF EXISTS "Acesso público para visualizar professores" ON public.professores;
CREATE POLICY "Acesso público para visualizar professores"
  ON public.professores
  FOR SELECT
  USING (true);