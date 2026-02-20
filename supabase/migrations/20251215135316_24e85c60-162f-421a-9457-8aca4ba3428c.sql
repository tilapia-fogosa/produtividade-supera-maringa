-- =====================================================
-- BLOCO 1: CORE PEDAGÓGICO - Limpeza e Padronização RLS
-- Tabelas: alunos, turmas, professores, funcionarios, produtividade_abaco
-- =====================================================

-- =====================================================
-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES
-- =====================================================

-- ALUNOS (4 políticas)
DROP POLICY IF EXISTS "Acesso público para atualizar alunos" ON public.alunos;
DROP POLICY IF EXISTS "Acesso público para inserir alunos" ON public.alunos;
DROP POLICY IF EXISTS "Acesso público para visualizar alunos" ON public.alunos;
DROP POLICY IF EXISTS "Authenticated users have full access to alunos" ON public.alunos;
DROP POLICY IF EXISTS "alunos_select" ON public.alunos;
DROP POLICY IF EXISTS "alunos_insert" ON public.alunos;
DROP POLICY IF EXISTS "alunos_update" ON public.alunos;
DROP POLICY IF EXISTS "alunos_delete" ON public.alunos;

-- TURMAS (8 políticas)
DROP POLICY IF EXISTS "Acesso público para atualizar turmas" ON public.turmas;
DROP POLICY IF EXISTS "Acesso público para inserir turmas" ON public.turmas;
DROP POLICY IF EXISTS "Acesso público para visualizar turmas" ON public.turmas;
DROP POLICY IF EXISTS "Authenticated users have full access to turmas" ON public.turmas;
DROP POLICY IF EXISTS "Permitir atualização de turmas" ON public.turmas;
DROP POLICY IF EXISTS "Permitir exclusão de turmas" ON public.turmas;
DROP POLICY IF EXISTS "Permitir inserção de turmas" ON public.turmas;
DROP POLICY IF EXISTS "Permitir leitura das turmas" ON public.turmas;
DROP POLICY IF EXISTS "turmas_select" ON public.turmas;
DROP POLICY IF EXISTS "turmas_insert" ON public.turmas;
DROP POLICY IF EXISTS "turmas_update" ON public.turmas;
DROP POLICY IF EXISTS "turmas_delete" ON public.turmas;

-- PROFESSORES (8 políticas)
DROP POLICY IF EXISTS "Acesso público para atualizar professores" ON public.professores;
DROP POLICY IF EXISTS "Acesso público para inserir professores" ON public.professores;
DROP POLICY IF EXISTS "Acesso público para visualizar professores" ON public.professores;
DROP POLICY IF EXISTS "Authenticated users have full access to professores" ON public.professores;
DROP POLICY IF EXISTS "Permitir atualização de professores" ON public.professores;
DROP POLICY IF EXISTS "Permitir exclusão de professores" ON public.professores;
DROP POLICY IF EXISTS "Permitir inserção de professores" ON public.professores;
DROP POLICY IF EXISTS "Permitir leitura dos professores" ON public.professores;
DROP POLICY IF EXISTS "professores_select" ON public.professores;
DROP POLICY IF EXISTS "professores_insert" ON public.professores;
DROP POLICY IF EXISTS "professores_update" ON public.professores;
DROP POLICY IF EXISTS "professores_delete" ON public.professores;

-- FUNCIONARIOS (4 políticas)
DROP POLICY IF EXISTS "Acesso público para atualizar funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Acesso público para inserir funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Acesso público para visualizar funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Authenticated users have full access to funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_select" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_insert" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_update" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_delete" ON public.funcionarios;

-- PRODUTIVIDADE_ABACO (9 políticas)
DROP POLICY IF EXISTS "Acesso anônimo para produtividade_abaco DELETE" ON public.produtividade_abaco;
DROP POLICY IF EXISTS "Acesso anônimo para produtividade_abaco INSERT" ON public.produtividade_abaco;
DROP POLICY IF EXISTS "Acesso anônimo para produtividade_abaco SELECT" ON public.produtividade_abaco;
DROP POLICY IF EXISTS "Acesso anônimo para produtividade_abaco UPDATE" ON public.produtividade_abaco;
DROP POLICY IF EXISTS "Authenticated users have full access to produtividade_abaco" ON public.produtividade_abaco;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar produtividade_abaco" ON public.produtividade_abaco;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir produtividade_abaco" ON public.produtividade_abaco;
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar produtividade_abaco" ON public.produtividade_abaco;
DROP POLICY IF EXISTS "Usuários podem registrar produtividade de alunos de suas unida" ON public.produtividade_abaco;
DROP POLICY IF EXISTS "Usuários podem ver produtividade de alunos de suas unidades" ON public.produtividade_abaco;
DROP POLICY IF EXISTS "produtividade_abaco_select" ON public.produtividade_abaco;
DROP POLICY IF EXISTS "produtividade_abaco_insert" ON public.produtividade_abaco;
DROP POLICY IF EXISTS "produtividade_abaco_update" ON public.produtividade_abaco;
DROP POLICY IF EXISTS "produtividade_abaco_delete" ON public.produtividade_abaco;

-- =====================================================
-- 2. CRIAR NOVAS POLÍTICAS PADRONIZADAS
-- =====================================================

-- ALUNOS (4 políticas)
CREATE POLICY "alunos_select" ON public.alunos
  FOR SELECT TO authenticated
  USING (user_has_access_to_unit(unit_id));

CREATE POLICY "alunos_insert" ON public.alunos
  FOR INSERT TO authenticated
  WITH CHECK (user_has_access_to_unit(unit_id));

CREATE POLICY "alunos_update" ON public.alunos
  FOR UPDATE TO authenticated
  USING (user_has_access_to_unit(unit_id));

CREATE POLICY "alunos_delete" ON public.alunos
  FOR DELETE TO authenticated
  USING (user_has_access_to_unit(unit_id));

-- TURMAS (4 políticas)
CREATE POLICY "turmas_select" ON public.turmas
  FOR SELECT TO authenticated
  USING (user_has_access_to_unit(unit_id));

CREATE POLICY "turmas_insert" ON public.turmas
  FOR INSERT TO authenticated
  WITH CHECK (user_has_access_to_unit(unit_id));

CREATE POLICY "turmas_update" ON public.turmas
  FOR UPDATE TO authenticated
  USING (user_has_access_to_unit(unit_id));

CREATE POLICY "turmas_delete" ON public.turmas
  FOR DELETE TO authenticated
  USING (user_has_access_to_unit(unit_id));

-- PROFESSORES (4 políticas)
CREATE POLICY "professores_select" ON public.professores
  FOR SELECT TO authenticated
  USING (user_has_access_to_unit(unit_id));

CREATE POLICY "professores_insert" ON public.professores
  FOR INSERT TO authenticated
  WITH CHECK (user_has_access_to_unit(unit_id));

CREATE POLICY "professores_update" ON public.professores
  FOR UPDATE TO authenticated
  USING (user_has_access_to_unit(unit_id));

CREATE POLICY "professores_delete" ON public.professores
  FOR DELETE TO authenticated
  USING (user_has_access_to_unit(unit_id));

-- FUNCIONARIOS (4 políticas)
CREATE POLICY "funcionarios_select" ON public.funcionarios
  FOR SELECT TO authenticated
  USING (user_has_access_to_unit(unit_id));

CREATE POLICY "funcionarios_insert" ON public.funcionarios
  FOR INSERT TO authenticated
  WITH CHECK (user_has_access_to_unit(unit_id));

CREATE POLICY "funcionarios_update" ON public.funcionarios
  FOR UPDATE TO authenticated
  USING (user_has_access_to_unit(unit_id));

CREATE POLICY "funcionarios_delete" ON public.funcionarios
  FOR DELETE TO authenticated
  USING (user_has_access_to_unit(unit_id));

-- PRODUTIVIDADE_ABACO (4 políticas - usando pessoa_id + tipo_pessoa para verificar unit_id)
CREATE POLICY "produtividade_abaco_select" ON public.produtividade_abaco
  FOR SELECT TO authenticated
  USING (
    (tipo_pessoa = 'aluno' AND EXISTS (
      SELECT 1 FROM alunos a 
      WHERE a.id = produtividade_abaco.pessoa_id 
      AND user_has_access_to_unit(a.unit_id)
    ))
    OR (tipo_pessoa = 'funcionario' AND EXISTS (
      SELECT 1 FROM funcionarios f 
      WHERE f.id = produtividade_abaco.pessoa_id 
      AND user_has_access_to_unit(f.unit_id)
    ))
    OR (tipo_pessoa IS NULL AND EXISTS (
      SELECT 1 FROM alunos a 
      WHERE a.id = produtividade_abaco.pessoa_id 
      AND user_has_access_to_unit(a.unit_id)
    ))
  );

CREATE POLICY "produtividade_abaco_insert" ON public.produtividade_abaco
  FOR INSERT TO authenticated
  WITH CHECK (
    (tipo_pessoa = 'aluno' AND EXISTS (
      SELECT 1 FROM alunos a 
      WHERE a.id = produtividade_abaco.pessoa_id 
      AND user_has_access_to_unit(a.unit_id)
    ))
    OR (tipo_pessoa = 'funcionario' AND EXISTS (
      SELECT 1 FROM funcionarios f 
      WHERE f.id = produtividade_abaco.pessoa_id 
      AND user_has_access_to_unit(f.unit_id)
    ))
    OR (tipo_pessoa IS NULL AND EXISTS (
      SELECT 1 FROM alunos a 
      WHERE a.id = produtividade_abaco.pessoa_id 
      AND user_has_access_to_unit(a.unit_id)
    ))
  );

CREATE POLICY "produtividade_abaco_update" ON public.produtividade_abaco
  FOR UPDATE TO authenticated
  USING (
    (tipo_pessoa = 'aluno' AND EXISTS (
      SELECT 1 FROM alunos a 
      WHERE a.id = produtividade_abaco.pessoa_id 
      AND user_has_access_to_unit(a.unit_id)
    ))
    OR (tipo_pessoa = 'funcionario' AND EXISTS (
      SELECT 1 FROM funcionarios f 
      WHERE f.id = produtividade_abaco.pessoa_id 
      AND user_has_access_to_unit(f.unit_id)
    ))
    OR (tipo_pessoa IS NULL AND EXISTS (
      SELECT 1 FROM alunos a 
      WHERE a.id = produtividade_abaco.pessoa_id 
      AND user_has_access_to_unit(a.unit_id)
    ))
  );

CREATE POLICY "produtividade_abaco_delete" ON public.produtividade_abaco
  FOR DELETE TO authenticated
  USING (
    (tipo_pessoa = 'aluno' AND EXISTS (
      SELECT 1 FROM alunos a 
      WHERE a.id = produtividade_abaco.pessoa_id 
      AND user_has_access_to_unit(a.unit_id)
    ))
    OR (tipo_pessoa = 'funcionario' AND EXISTS (
      SELECT 1 FROM funcionarios f 
      WHERE f.id = produtividade_abaco.pessoa_id 
      AND user_has_access_to_unit(f.unit_id)
    ))
    OR (tipo_pessoa IS NULL AND EXISTS (
      SELECT 1 FROM alunos a 
      WHERE a.id = produtividade_abaco.pessoa_id 
      AND user_has_access_to_unit(a.unit_id)
    ))
  );