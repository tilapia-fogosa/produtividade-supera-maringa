
-- =====================================================
-- MIGRAÇÃO RLS: BLOCOS 6, 7, 8 E 9
-- Padronização e limpeza de políticas
-- =====================================================

-- =====================================================
-- BLOCO 6: CONFIGURAÇÕES/REFERÊNCIA
-- =====================================================

-- 1. apostilas (tabela de referência global - 8 políticas duplicadas)
DROP POLICY IF EXISTS "Apenas admins podem atualizar apostilas" ON public.apostilas;
DROP POLICY IF EXISTS "Apenas admins podem deletar apostilas" ON public.apostilas;
DROP POLICY IF EXISTS "Apenas admins podem inserir apostilas" ON public.apostilas;
DROP POLICY IF EXISTS "Permitir leitura anônima de apostilas" ON public.apostilas;
DROP POLICY IF EXISTS "Permitir leitura pública das apostilas" ON public.apostilas;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar apostilas" ON public.apostilas;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir apostilas" ON public.apostilas;
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar apostilas" ON public.apostilas;

CREATE POLICY "apostilas_select" ON public.apostilas
FOR SELECT USING (true);

CREATE POLICY "apostilas_insert" ON public.apostilas
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "apostilas_update" ON public.apostilas
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "apostilas_delete" ON public.apostilas
FOR DELETE USING (auth.uid() IS NOT NULL);

-- 2. class_types (tem unit_id direto - faltam INSERT/UPDATE/DELETE)
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar tipos de turma de suas " ON public.class_types;

CREATE POLICY "class_types_select" ON public.class_types
FOR SELECT USING (user_has_access_to_unit(unit_id));

CREATE POLICY "class_types_insert" ON public.class_types
FOR INSERT WITH CHECK (user_has_access_to_unit(unit_id));

CREATE POLICY "class_types_update" ON public.class_types
FOR UPDATE USING (user_has_access_to_unit(unit_id));

CREATE POLICY "class_types_delete" ON public.class_types
FOR DELETE USING (user_has_access_to_unit(unit_id));

-- 3. classes (tem unit_id direto - faltam INSERT/UPDATE/DELETE)
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar turmas de suas unidades" ON public.classes;

CREATE POLICY "classes_select" ON public.classes
FOR SELECT USING (user_has_access_to_unit(unit_id));

CREATE POLICY "classes_insert" ON public.classes
FOR INSERT WITH CHECK (user_has_access_to_unit(unit_id));

CREATE POLICY "classes_update" ON public.classes
FOR UPDATE USING (user_has_access_to_unit(unit_id));

CREATE POLICY "classes_delete" ON public.classes
FOR DELETE USING (user_has_access_to_unit(unit_id));

-- 4. units (manter leitura para unidades autorizadas)
DROP POLICY IF EXISTS "Acesso público para visualizar units" ON public.units;
DROP POLICY IF EXISTS "Users can view their authorized units" ON public.units;

CREATE POLICY "units_select" ON public.units
FOR SELECT USING (user_has_access_to_unit(id) OR public.is_system_admin());

CREATE POLICY "units_insert" ON public.units
FOR INSERT WITH CHECK (public.is_system_admin());

CREATE POLICY "units_update" ON public.units
FOR UPDATE USING (public.is_system_admin());

CREATE POLICY "units_delete" ON public.units
FOR DELETE USING (public.is_system_admin());

-- 5. unit_users (gerenciamento de acesso por unidade)
DROP POLICY IF EXISTS "Controle de acesso a unit_users" ON public.unit_users;
DROP POLICY IF EXISTS "System admins can delete unit_users" ON public.unit_users;
DROP POLICY IF EXISTS "System admins can insert unit_users" ON public.unit_users;
DROP POLICY IF EXISTS "System admins can update unit_users" ON public.unit_users;
DROP POLICY IF EXISTS "Users can view own unit_users" ON public.unit_users;

CREATE POLICY "unit_users_select" ON public.unit_users
FOR SELECT USING (user_id = auth.uid() OR public.is_system_admin());

CREATE POLICY "unit_users_insert" ON public.unit_users
FOR INSERT WITH CHECK (public.is_system_admin());

CREATE POLICY "unit_users_update" ON public.unit_users
FOR UPDATE USING (public.is_system_admin());

CREATE POLICY "unit_users_delete" ON public.unit_users
FOR DELETE USING (public.is_system_admin());

-- 6. profiles (perfil de usuário)
DROP POLICY IF EXISTS "Authenticated users can view all profiles for joins" ON public.profiles;
DROP POLICY IF EXISTS "Controle de acesso a profiles" ON public.profiles;
DROP POLICY IF EXISTS "System admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "profiles_insert" ON public.profiles
FOR INSERT WITH CHECK (id = auth.uid() OR public.is_system_admin());

CREATE POLICY "profiles_update" ON public.profiles
FOR UPDATE USING (id = auth.uid() OR public.is_system_admin());

CREATE POLICY "profiles_delete" ON public.profiles
FOR DELETE USING (public.is_system_admin());

-- =====================================================
-- BLOCO 7: BACKUP/AUXILIARES
-- =====================================================

-- 1. alunos_backup (sem RLS - habilitar com acesso por unit_id)
ALTER TABLE public.alunos_backup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alunos_backup_select" ON public.alunos_backup
FOR SELECT USING (user_has_access_to_unit(unit_id));

CREATE POLICY "alunos_backup_insert" ON public.alunos_backup
FOR INSERT WITH CHECK (user_has_access_to_unit(unit_id));

CREATE POLICY "alunos_backup_update" ON public.alunos_backup
FOR UPDATE USING (user_has_access_to_unit(unit_id));

CREATE POLICY "alunos_backup_delete" ON public.alunos_backup
FOR DELETE USING (user_has_access_to_unit(unit_id));

-- 2. alunos_backup1 (políticas com true - corrigir para unit_id)
DROP POLICY IF EXISTS "Acesso público para visualizar alunos backup1" ON public.alunos_backup1;
DROP POLICY IF EXISTS "Acesso público para inserir alunos backup1" ON public.alunos_backup1;
DROP POLICY IF EXISTS "Acesso público para atualizar alunos backup1" ON public.alunos_backup1;
DROP POLICY IF EXISTS "Acesso público para deletar alunos backup1" ON public.alunos_backup1;

CREATE POLICY "alunos_backup1_select" ON public.alunos_backup1
FOR SELECT USING (user_has_access_to_unit(unit_id));

CREATE POLICY "alunos_backup1_insert" ON public.alunos_backup1
FOR INSERT WITH CHECK (user_has_access_to_unit(unit_id));

CREATE POLICY "alunos_backup1_update" ON public.alunos_backup1
FOR UPDATE USING (user_has_access_to_unit(unit_id));

CREATE POLICY "alunos_backup1_delete" ON public.alunos_backup1
FOR DELETE USING (user_has_access_to_unit(unit_id));

-- 3. alunos_backup2 (políticas com true - corrigir para unit_id)
DROP POLICY IF EXISTS "Acesso público para visualizar alunos backup2" ON public.alunos_backup2;
DROP POLICY IF EXISTS "Acesso público para inserir alunos backup2" ON public.alunos_backup2;
DROP POLICY IF EXISTS "Acesso público para atualizar alunos backup2" ON public.alunos_backup2;
DROP POLICY IF EXISTS "Acesso público para deletar alunos backup2" ON public.alunos_backup2;

CREATE POLICY "alunos_backup2_select" ON public.alunos_backup2
FOR SELECT USING (user_has_access_to_unit(unit_id));

CREATE POLICY "alunos_backup2_insert" ON public.alunos_backup2
FOR INSERT WITH CHECK (user_has_access_to_unit(unit_id));

CREATE POLICY "alunos_backup2_update" ON public.alunos_backup2
FOR UPDATE USING (user_has_access_to_unit(unit_id));

CREATE POLICY "alunos_backup2_delete" ON public.alunos_backup2
FOR DELETE USING (user_has_access_to_unit(unit_id));

-- 4. backup_metadata (políticas com true - corrigir para unit_id)
DROP POLICY IF EXISTS "Acesso público para visualizar metadados backup" ON public.backup_metadata;
DROP POLICY IF EXISTS "Acesso público para inserir metadados backup" ON public.backup_metadata;
DROP POLICY IF EXISTS "Acesso público para atualizar metadados backup" ON public.backup_metadata;
DROP POLICY IF EXISTS "Acesso público para deletar metadados backup" ON public.backup_metadata;

CREATE POLICY "backup_metadata_select" ON public.backup_metadata
FOR SELECT USING (user_has_access_to_unit(unit_id));

CREATE POLICY "backup_metadata_insert" ON public.backup_metadata
FOR INSERT WITH CHECK (user_has_access_to_unit(unit_id));

CREATE POLICY "backup_metadata_update" ON public.backup_metadata
FOR UPDATE USING (user_has_access_to_unit(unit_id));

CREATE POLICY "backup_metadata_delete" ON public.backup_metadata
FOR DELETE USING (user_has_access_to_unit(unit_id));

-- =====================================================
-- BLOCO 8: FINANCEIRO PESSOAL (já corretos - apenas padronizar nomes)
-- =====================================================

-- accounts_payable, accounts_receivable, cash_accounts, calendar_events
-- Já usam auth.uid() = user_id, mantendo como estão

-- =====================================================
-- BLOCO 9: OUTROS
-- =====================================================

-- 1. dados_importantes (tabela de configuração global)
DROP POLICY IF EXISTS "Permitir atualização de dados importantes" ON public.dados_importantes;
DROP POLICY IF EXISTS "Permitir exclusão de dados importantes" ON public.dados_importantes;
DROP POLICY IF EXISTS "Permitir inserção de dados importantes" ON public.dados_importantes;
DROP POLICY IF EXISTS "Permitir leitura dos dados importantes" ON public.dados_importantes;
DROP POLICY IF EXISTS "Permitir leitura para todos os usuários" ON public.dados_importantes;

CREATE POLICY "dados_importantes_select" ON public.dados_importantes
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "dados_importantes_insert" ON public.dados_importantes
FOR INSERT WITH CHECK (public.is_system_admin());

CREATE POLICY "dados_importantes_update" ON public.dados_importantes
FOR UPDATE USING (public.is_system_admin());

CREATE POLICY "dados_importantes_delete" ON public.dados_importantes
FOR DELETE USING (public.is_system_admin());

-- 2. eventos (tem unit_id direto)
DROP POLICY IF EXISTS "Usuários podem atualizar eventos" ON public.eventos;
DROP POLICY IF EXISTS "Usuários podem criar eventos" ON public.eventos;
DROP POLICY IF EXISTS "Usuários podem deletar eventos" ON public.eventos;
DROP POLICY IF EXISTS "Usuários podem visualizar eventos" ON public.eventos;

CREATE POLICY "eventos_select" ON public.eventos
FOR SELECT USING (user_has_access_to_unit(unit_id));

CREATE POLICY "eventos_insert" ON public.eventos
FOR INSERT WITH CHECK (user_has_access_to_unit(unit_id));

CREATE POLICY "eventos_update" ON public.eventos
FOR UPDATE USING (user_has_access_to_unit(unit_id));

CREATE POLICY "eventos_delete" ON public.eventos
FOR DELETE USING (user_has_access_to_unit(unit_id));

-- 3. eventos_professor (usa professor_id -> professores.unit_id)
DROP POLICY IF EXISTS "Acesso público para visualizar eventos professor" ON public.eventos_professor;
DROP POLICY IF EXISTS "Acesso público para inserir eventos professor" ON public.eventos_professor;
DROP POLICY IF EXISTS "Acesso público para atualizar eventos professor" ON public.eventos_professor;
DROP POLICY IF EXISTS "Acesso público para deletar eventos professor" ON public.eventos_professor;
DROP POLICY IF EXISTS "Apenas autenticados podem atualizar eventos professor" ON public.eventos_professor;
DROP POLICY IF EXISTS "Apenas autenticados podem deletar eventos professor" ON public.eventos_professor;
DROP POLICY IF EXISTS "Eventos professor visíveis para todos autenticados" ON public.eventos_professor;
DROP POLICY IF EXISTS "Usuários autenticados podem criar eventos" ON public.eventos_professor;

CREATE POLICY "eventos_professor_select" ON public.eventos_professor
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM professores p 
    WHERE p.id = eventos_professor.professor_id 
    AND user_has_access_to_unit(p.unit_id)
  )
);

CREATE POLICY "eventos_professor_insert" ON public.eventos_professor
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM professores p 
    WHERE p.id = eventos_professor.professor_id 
    AND user_has_access_to_unit(p.unit_id)
  )
);

CREATE POLICY "eventos_professor_update" ON public.eventos_professor
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM professores p 
    WHERE p.id = eventos_professor.professor_id 
    AND user_has_access_to_unit(p.unit_id)
  )
);

CREATE POLICY "eventos_professor_delete" ON public.eventos_professor
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM professores p 
    WHERE p.id = eventos_professor.professor_id 
    AND user_has_access_to_unit(p.unit_id)
  )
);

-- 4. eventos_sala (tem unit_id direto)
DROP POLICY IF EXISTS "Permitir leitura pública de eventos_sala" ON public.eventos_sala;
DROP POLICY IF EXISTS "Permitir inserção pública de eventos_sala" ON public.eventos_sala;
DROP POLICY IF EXISTS "Permitir atualização pública de eventos_sala" ON public.eventos_sala;
DROP POLICY IF EXISTS "Permitir exclusão pública de eventos_sala" ON public.eventos_sala;

CREATE POLICY "eventos_sala_select" ON public.eventos_sala
FOR SELECT USING (user_has_access_to_unit(unit_id));

CREATE POLICY "eventos_sala_insert" ON public.eventos_sala
FOR INSERT WITH CHECK (user_has_access_to_unit(unit_id));

CREATE POLICY "eventos_sala_update" ON public.eventos_sala
FOR UPDATE USING (user_has_access_to_unit(unit_id));

CREATE POLICY "eventos_sala_delete" ON public.eventos_sala
FOR DELETE USING (user_has_access_to_unit(unit_id));

-- 5. salas (tem unit_id direto)
DROP POLICY IF EXISTS "Permitir leitura de salas para autenticados" ON public.salas;
DROP POLICY IF EXISTS "Permitir leitura de salas para público" ON public.salas;

CREATE POLICY "salas_select" ON public.salas
FOR SELECT USING (user_has_access_to_unit(unit_id));

CREATE POLICY "salas_insert" ON public.salas
FOR INSERT WITH CHECK (user_has_access_to_unit(unit_id));

CREATE POLICY "salas_update" ON public.salas
FOR UPDATE USING (user_has_access_to_unit(unit_id));

CREATE POLICY "salas_delete" ON public.salas
FOR DELETE USING (user_has_access_to_unit(unit_id));

-- 6. trofeus_1000_dias (usa aluno_id -> alunos.unit_id)
DROP POLICY IF EXISTS "Acesso público para visualizar troféus" ON public.trofeus_1000_dias;
DROP POLICY IF EXISTS "Acesso público para inserir troféus" ON public.trofeus_1000_dias;
DROP POLICY IF EXISTS "Acesso público para atualizar troféus" ON public.trofeus_1000_dias;
DROP POLICY IF EXISTS "Acesso público para deletar troféus" ON public.trofeus_1000_dias;

CREATE POLICY "trofeus_1000_dias_select" ON public.trofeus_1000_dias
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = trofeus_1000_dias.aluno_id 
    AND user_has_access_to_unit(a.unit_id)
  )
);

CREATE POLICY "trofeus_1000_dias_insert" ON public.trofeus_1000_dias
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = trofeus_1000_dias.aluno_id 
    AND user_has_access_to_unit(a.unit_id)
  )
);

CREATE POLICY "trofeus_1000_dias_update" ON public.trofeus_1000_dias
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = trofeus_1000_dias.aluno_id 
    AND user_has_access_to_unit(a.unit_id)
  )
);

CREATE POLICY "trofeus_1000_dias_delete" ON public.trofeus_1000_dias
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM alunos a 
    WHERE a.id = trofeus_1000_dias.aluno_id 
    AND user_has_access_to_unit(a.unit_id)
  )
);

-- 7. funcionalidades_unidade (já tem políticas, padronizar)
DROP POLICY IF EXISTS "Admins podem gerenciar funcionalidades" ON public.funcionalidades_unidade;
DROP POLICY IF EXISTS "Usuários podem ver funcionalidades de suas unidades" ON public.funcionalidades_unidade;

CREATE POLICY "funcionalidades_unidade_select" ON public.funcionalidades_unidade
FOR SELECT USING (user_has_access_to_unit(unit_id));

CREATE POLICY "funcionalidades_unidade_insert" ON public.funcionalidades_unidade
FOR INSERT WITH CHECK (public.is_system_admin());

CREATE POLICY "funcionalidades_unidade_update" ON public.funcionalidades_unidade
FOR UPDATE USING (public.is_system_admin());

CREATE POLICY "funcionalidades_unidade_delete" ON public.funcionalidades_unidade
FOR DELETE USING (public.is_system_admin());

-- 8. whatsapp_mensagens_automaticas (tem unit_id direto)
DROP POLICY IF EXISTS "Users can update automatic messages from their units" ON public.whatsapp_mensagens_automaticas;
DROP POLICY IF EXISTS "Users can view automatic messages from their units" ON public.whatsapp_mensagens_automaticas;

CREATE POLICY "whatsapp_mensagens_automaticas_select" ON public.whatsapp_mensagens_automaticas
FOR SELECT USING (user_has_access_to_unit(unit_id));

CREATE POLICY "whatsapp_mensagens_automaticas_insert" ON public.whatsapp_mensagens_automaticas
FOR INSERT WITH CHECK (user_has_access_to_unit(unit_id));

CREATE POLICY "whatsapp_mensagens_automaticas_update" ON public.whatsapp_mensagens_automaticas
FOR UPDATE USING (user_has_access_to_unit(unit_id));

CREATE POLICY "whatsapp_mensagens_automaticas_delete" ON public.whatsapp_mensagens_automaticas
FOR DELETE USING (user_has_access_to_unit(unit_id));

-- 9. pos_venda_atividades_config (tem unit_id - padronizar)
DROP POLICY IF EXISTS "Users can manage activities config from their units" ON public.pos_venda_atividades_config;
DROP POLICY IF EXISTS "Users can manage config from their units" ON public.pos_venda_atividades_config;
DROP POLICY IF EXISTS "Users can view activities config from their units" ON public.pos_venda_atividades_config;
DROP POLICY IF EXISTS "Users can view config from their units" ON public.pos_venda_atividades_config;

CREATE POLICY "pos_venda_atividades_config_select" ON public.pos_venda_atividades_config
FOR SELECT USING (user_has_access_to_unit(unit_id));

CREATE POLICY "pos_venda_atividades_config_insert" ON public.pos_venda_atividades_config
FOR INSERT WITH CHECK (user_has_access_to_unit(unit_id));

CREATE POLICY "pos_venda_atividades_config_update" ON public.pos_venda_atividades_config
FOR UPDATE USING (user_has_access_to_unit(unit_id));

CREATE POLICY "pos_venda_atividades_config_delete" ON public.pos_venda_atividades_config
FOR DELETE USING (user_has_access_to_unit(unit_id));

-- 10. pos_venda_atividades_realizadas (padronizar - usa JOIN com atividade_pos_venda)
DROP POLICY IF EXISTS "Users can manage realizadas from their units" ON public.pos_venda_atividades_realizadas;
DROP POLICY IF EXISTS "Users can manage realized activities from their units" ON public.pos_venda_atividades_realizadas;
DROP POLICY IF EXISTS "Users can view realizadas from their units" ON public.pos_venda_atividades_realizadas;
DROP POLICY IF EXISTS "Users can view realized activities from their units" ON public.pos_venda_atividades_realizadas;

CREATE POLICY "pos_venda_atividades_realizadas_select" ON public.pos_venda_atividades_realizadas
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM atividade_pos_venda apv
    JOIN clients c ON apv.client_id = c.id
    WHERE apv.id = pos_venda_atividades_realizadas.atividade_pos_venda_id
    AND user_has_access_to_unit(c.unit_id)
  )
);

CREATE POLICY "pos_venda_atividades_realizadas_insert" ON public.pos_venda_atividades_realizadas
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM atividade_pos_venda apv
    JOIN clients c ON apv.client_id = c.id
    WHERE apv.id = pos_venda_atividades_realizadas.atividade_pos_venda_id
    AND user_has_access_to_unit(c.unit_id)
  )
);

CREATE POLICY "pos_venda_atividades_realizadas_update" ON public.pos_venda_atividades_realizadas
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM atividade_pos_venda apv
    JOIN clients c ON apv.client_id = c.id
    WHERE apv.id = pos_venda_atividades_realizadas.atividade_pos_venda_id
    AND user_has_access_to_unit(c.unit_id)
  )
);

CREATE POLICY "pos_venda_atividades_realizadas_delete" ON public.pos_venda_atividades_realizadas
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM atividade_pos_venda apv
    JOIN clients c ON apv.client_id = c.id
    WHERE apv.id = pos_venda_atividades_realizadas.atividade_pos_venda_id
    AND user_has_access_to_unit(c.unit_id)
  )
);
