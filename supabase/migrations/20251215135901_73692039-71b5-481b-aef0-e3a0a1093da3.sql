
-- =====================================================
-- MIGRAÇÃO RLS: BLOCOS 2, 3 E 4
-- Padronização usando user_has_access_to_unit()
-- =====================================================

-- =====================================================
-- BLOCO 2: PROGRAMA AH
-- =====================================================

-- 1. produtividade_ah (usa pessoa_id -> alunos/funcionarios)
-- Sem políticas existentes, apenas criar novas

CREATE POLICY "produtividade_ah_select" ON public.produtividade_ah
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = produtividade_ah.pessoa_id 
    AND user_has_access_to_unit(a.unit_id)
  )
  OR EXISTS (
    SELECT 1 FROM funcionarios f 
    WHERE f.id = produtividade_ah.pessoa_id 
    AND user_has_access_to_unit(f.unit_id)
  )
);

CREATE POLICY "produtividade_ah_insert" ON public.produtividade_ah
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = produtividade_ah.pessoa_id 
    AND user_has_access_to_unit(a.unit_id)
  )
  OR EXISTS (
    SELECT 1 FROM funcionarios f 
    WHERE f.id = produtividade_ah.pessoa_id 
    AND user_has_access_to_unit(f.unit_id)
  )
);

CREATE POLICY "produtividade_ah_update" ON public.produtividade_ah
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = produtividade_ah.pessoa_id 
    AND user_has_access_to_unit(a.unit_id)
  )
  OR EXISTS (
    SELECT 1 FROM funcionarios f 
    WHERE f.id = produtividade_ah.pessoa_id 
    AND user_has_access_to_unit(f.unit_id)
  )
);

CREATE POLICY "produtividade_ah_delete" ON public.produtividade_ah
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = produtividade_ah.pessoa_id 
    AND user_has_access_to_unit(a.unit_id)
  )
  OR EXISTS (
    SELECT 1 FROM funcionarios f 
    WHERE f.id = produtividade_ah.pessoa_id 
    AND user_has_access_to_unit(f.unit_id)
  )
);

-- 2. ah_recolhidas (usa pessoa_id -> alunos/funcionarios)
DROP POLICY IF EXISTS "Acesso público para visualizar recolhimentos" ON public.ah_recolhidas;
DROP POLICY IF EXISTS "Acesso público para inserir recolhimentos" ON public.ah_recolhidas;
DROP POLICY IF EXISTS "Acesso público para atualizar recolhimentos" ON public.ah_recolhidas;
DROP POLICY IF EXISTS "Acesso público para deletar recolhimentos" ON public.ah_recolhidas;

CREATE POLICY "ah_recolhidas_select" ON public.ah_recolhidas
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = ah_recolhidas.pessoa_id 
    AND user_has_access_to_unit(a.unit_id)
  )
  OR EXISTS (
    SELECT 1 FROM funcionarios f 
    WHERE f.id = ah_recolhidas.pessoa_id 
    AND user_has_access_to_unit(f.unit_id)
  )
);

CREATE POLICY "ah_recolhidas_insert" ON public.ah_recolhidas
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = ah_recolhidas.pessoa_id 
    AND user_has_access_to_unit(a.unit_id)
  )
  OR EXISTS (
    SELECT 1 FROM funcionarios f 
    WHERE f.id = ah_recolhidas.pessoa_id 
    AND user_has_access_to_unit(f.unit_id)
  )
);

CREATE POLICY "ah_recolhidas_update" ON public.ah_recolhidas
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = ah_recolhidas.pessoa_id 
    AND user_has_access_to_unit(a.unit_id)
  )
  OR EXISTS (
    SELECT 1 FROM funcionarios f 
    WHERE f.id = ah_recolhidas.pessoa_id 
    AND user_has_access_to_unit(f.unit_id)
  )
);

CREATE POLICY "ah_recolhidas_delete" ON public.ah_recolhidas
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = ah_recolhidas.pessoa_id 
    AND user_has_access_to_unit(a.unit_id)
  )
  OR EXISTS (
    SELECT 1 FROM funcionarios f 
    WHERE f.id = ah_recolhidas.pessoa_id 
    AND user_has_access_to_unit(f.unit_id)
  )
);

-- 3. ah_ignorar_coleta (usa pessoa_id -> alunos/funcionarios)
DROP POLICY IF EXISTS "Permitir leitura pública de ignorar coleta" ON public.ah_ignorar_coleta;
DROP POLICY IF EXISTS "Permitir inserção pública de ignorar coleta" ON public.ah_ignorar_coleta;
DROP POLICY IF EXISTS "Permitir atualização pública de ignorar coleta" ON public.ah_ignorar_coleta;
DROP POLICY IF EXISTS "Permitir exclusão pública de ignorar coleta" ON public.ah_ignorar_coleta;

CREATE POLICY "ah_ignorar_coleta_select" ON public.ah_ignorar_coleta
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = ah_ignorar_coleta.pessoa_id 
    AND user_has_access_to_unit(a.unit_id)
  )
  OR EXISTS (
    SELECT 1 FROM funcionarios f 
    WHERE f.id = ah_ignorar_coleta.pessoa_id 
    AND user_has_access_to_unit(f.unit_id)
  )
);

CREATE POLICY "ah_ignorar_coleta_insert" ON public.ah_ignorar_coleta
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = ah_ignorar_coleta.pessoa_id 
    AND user_has_access_to_unit(a.unit_id)
  )
  OR EXISTS (
    SELECT 1 FROM funcionarios f 
    WHERE f.id = ah_ignorar_coleta.pessoa_id 
    AND user_has_access_to_unit(f.unit_id)
  )
);

CREATE POLICY "ah_ignorar_coleta_update" ON public.ah_ignorar_coleta
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = ah_ignorar_coleta.pessoa_id 
    AND user_has_access_to_unit(a.unit_id)
  )
  OR EXISTS (
    SELECT 1 FROM funcionarios f 
    WHERE f.id = ah_ignorar_coleta.pessoa_id 
    AND user_has_access_to_unit(f.unit_id)
  )
);

CREATE POLICY "ah_ignorar_coleta_delete" ON public.ah_ignorar_coleta
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = ah_ignorar_coleta.pessoa_id 
    AND user_has_access_to_unit(a.unit_id)
  )
  OR EXISTS (
    SELECT 1 FROM funcionarios f 
    WHERE f.id = ah_ignorar_coleta.pessoa_id 
    AND user_has_access_to_unit(f.unit_id)
  )
);

-- 4. apostilas_ah (tabela de referência - leitura pública, escrita autenticada)
DROP POLICY IF EXISTS "Permitir leitura pública de apostilas_ah" ON public.apostilas_ah;
DROP POLICY IF EXISTS "Permitir inserção de apostilas_ah" ON public.apostilas_ah;
DROP POLICY IF EXISTS "Permitir atualização de apostilas_ah" ON public.apostilas_ah;
DROP POLICY IF EXISTS "Permitir exclusão de apostilas_ah" ON public.apostilas_ah;

CREATE POLICY "apostilas_ah_select" ON public.apostilas_ah
FOR SELECT USING (true);

CREATE POLICY "apostilas_ah_insert" ON public.apostilas_ah
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "apostilas_ah_update" ON public.apostilas_ah
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "apostilas_ah_delete" ON public.apostilas_ah
FOR DELETE USING (auth.uid() IS NOT NULL);

-- =====================================================
-- BLOCO 3: ALERTAS E RETENÇÃO
-- =====================================================

-- 1. alerta_evasao (usa aluno_id -> alunos.unit_id)
-- Sem políticas existentes, criar novas

CREATE POLICY "alerta_evasao_select" ON public.alerta_evasao
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = alerta_evasao.aluno_id 
    AND user_has_access_to_unit(a.unit_id)
  )
);

CREATE POLICY "alerta_evasao_insert" ON public.alerta_evasao
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = alerta_evasao.aluno_id 
    AND user_has_access_to_unit(a.unit_id)
  )
);

CREATE POLICY "alerta_evasao_update" ON public.alerta_evasao
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = alerta_evasao.aluno_id 
    AND user_has_access_to_unit(a.unit_id)
  )
);

CREATE POLICY "alerta_evasao_delete" ON public.alerta_evasao
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = alerta_evasao.aluno_id 
    AND user_has_access_to_unit(a.unit_id)
  )
);

-- 2. alertas_falta (tem unit_id direto)
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar alertas de falta" ON public.alertas_falta;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir alertas de falta" ON public.alertas_falta;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar alertas de falta" ON public.alertas_falta;

CREATE POLICY "alertas_falta_select" ON public.alertas_falta
FOR SELECT USING (user_has_access_to_unit(unit_id));

CREATE POLICY "alertas_falta_insert" ON public.alertas_falta
FOR INSERT WITH CHECK (user_has_access_to_unit(unit_id));

CREATE POLICY "alertas_falta_update" ON public.alertas_falta
FOR UPDATE USING (user_has_access_to_unit(unit_id));

CREATE POLICY "alertas_falta_delete" ON public.alertas_falta
FOR DELETE USING (user_has_access_to_unit(unit_id));

-- 3. alertas_lancamento (usa turma_id -> turmas.unit_id)
-- Sem políticas existentes, criar novas

CREATE POLICY "alertas_lancamento_select" ON public.alertas_lancamento
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM turmas t 
    WHERE t.id = alertas_lancamento.turma_id 
    AND user_has_access_to_unit(t.unit_id)
  )
);

CREATE POLICY "alertas_lancamento_insert" ON public.alertas_lancamento
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM turmas t 
    WHERE t.id = alertas_lancamento.turma_id 
    AND user_has_access_to_unit(t.unit_id)
  )
);

CREATE POLICY "alertas_lancamento_update" ON public.alertas_lancamento
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM turmas t 
    WHERE t.id = alertas_lancamento.turma_id 
    AND user_has_access_to_unit(t.unit_id)
  )
);

CREATE POLICY "alertas_lancamento_delete" ON public.alertas_lancamento
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM turmas t 
    WHERE t.id = alertas_lancamento.turma_id 
    AND user_has_access_to_unit(t.unit_id)
  )
);

-- 4. retencoes (tem unit_id direto)
DROP POLICY IF EXISTS "Users can view retencoes" ON public.retencoes;
DROP POLICY IF EXISTS "Users can create retencoes" ON public.retencoes;
DROP POLICY IF EXISTS "Users can update retencoes" ON public.retencoes;
DROP POLICY IF EXISTS "Users can delete retencoes" ON public.retencoes;

CREATE POLICY "retencoes_select" ON public.retencoes
FOR SELECT USING (user_has_access_to_unit(unit_id));

CREATE POLICY "retencoes_insert" ON public.retencoes
FOR INSERT WITH CHECK (user_has_access_to_unit(unit_id));

CREATE POLICY "retencoes_update" ON public.retencoes
FOR UPDATE USING (user_has_access_to_unit(unit_id));

CREATE POLICY "retencoes_delete" ON public.retencoes
FOR DELETE USING (user_has_access_to_unit(unit_id));

-- =====================================================
-- BLOCO 4: OPERACIONAL
-- =====================================================

-- 1. reposicoes (tem unit_id direto)
DROP POLICY IF EXISTS "Acesso público para visualizar reposições" ON public.reposicoes;
DROP POLICY IF EXISTS "Acesso público para inserir reposições" ON public.reposicoes;
DROP POLICY IF EXISTS "Acesso público para atualizar reposições" ON public.reposicoes;
DROP POLICY IF EXISTS "Acesso público para deletar reposições" ON public.reposicoes;
DROP POLICY IF EXISTS "Permitir leitura pública de reposições" ON public.reposicoes;
DROP POLICY IF EXISTS "Permitir inserção pública de reposições" ON public.reposicoes;
DROP POLICY IF EXISTS "Permitir atualização pública de reposições" ON public.reposicoes;

CREATE POLICY "reposicoes_select" ON public.reposicoes
FOR SELECT USING (user_has_access_to_unit(unit_id));

CREATE POLICY "reposicoes_insert" ON public.reposicoes
FOR INSERT WITH CHECK (user_has_access_to_unit(unit_id));

CREATE POLICY "reposicoes_update" ON public.reposicoes
FOR UPDATE USING (user_has_access_to_unit(unit_id));

CREATE POLICY "reposicoes_delete" ON public.reposicoes
FOR DELETE USING (user_has_access_to_unit(unit_id));

-- 2. aulas_experimentais (tem unit_id direto)
DROP POLICY IF EXISTS "Users can view aulas experimentais" ON public.aulas_experimentais;
DROP POLICY IF EXISTS "Users can create aulas experimentais" ON public.aulas_experimentais;
DROP POLICY IF EXISTS "Users can update aulas experimentais" ON public.aulas_experimentais;
DROP POLICY IF EXISTS "Users can delete aulas experimentais" ON public.aulas_experimentais;

CREATE POLICY "aulas_experimentais_select" ON public.aulas_experimentais
FOR SELECT USING (user_has_access_to_unit(unit_id));

CREATE POLICY "aulas_experimentais_insert" ON public.aulas_experimentais
FOR INSERT WITH CHECK (user_has_access_to_unit(unit_id));

CREATE POLICY "aulas_experimentais_update" ON public.aulas_experimentais
FOR UPDATE USING (user_has_access_to_unit(unit_id));

CREATE POLICY "aulas_experimentais_delete" ON public.aulas_experimentais
FOR DELETE USING (user_has_access_to_unit(unit_id));

-- 3. camisetas (usa aluno_id -> alunos.unit_id)
DROP POLICY IF EXISTS "Users can view camisetas" ON public.camisetas;
DROP POLICY IF EXISTS "Users can insert camisetas" ON public.camisetas;
DROP POLICY IF EXISTS "Users can update camisetas" ON public.camisetas;

CREATE POLICY "camisetas_select" ON public.camisetas
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = camisetas.aluno_id 
    AND user_has_access_to_unit(a.unit_id)
  )
);

CREATE POLICY "camisetas_insert" ON public.camisetas
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = camisetas.aluno_id 
    AND user_has_access_to_unit(a.unit_id)
  )
);

CREATE POLICY "camisetas_update" ON public.camisetas
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = camisetas.aluno_id 
    AND user_has_access_to_unit(a.unit_id)
  )
);

CREATE POLICY "camisetas_delete" ON public.camisetas
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = camisetas.aluno_id 
    AND user_has_access_to_unit(a.unit_id)
  )
);
