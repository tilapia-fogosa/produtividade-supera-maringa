-- Criar tabelas de backup para alunos (slots 1 e 2)
CREATE TABLE public.alunos_backup1 (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  turma_id uuid,
  idade integer,
  dias_apostila integer,
  dias_supera integer,
  ultima_correcao_ah timestamp with time zone,
  active boolean NOT NULL DEFAULT true,
  ultima_falta date,
  ultima_pagina integer,
  is_funcionario boolean DEFAULT false,
  data_onboarding timestamp with time zone,
  unit_id uuid NOT NULL,
  valor_mensalidade numeric,
  faltas_consecutivas smallint NOT NULL DEFAULT 0,
  oculto_retencoes boolean NOT NULL DEFAULT false,
  ultima_sincronizacao timestamp with time zone,
  responsavel text NOT NULL DEFAULT 'o próprio',
  whatapp_contato text,
  coordenador_responsavel text,
  pontos_atencao text,
  avaliacao_ah text,
  avaliacao_abaco text,
  motivo_procura text,
  percepcao_coordenador text,
  texto_devolutiva text,
  niveldesafio text DEFAULT '1',
  vencimento_contrato text,
  ultimo_nivel text,
  matricula text,
  curso text,
  email text,
  telefone text,
  codigo text,
  indice text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  -- Campos de controle do backup
  backup_created_at timestamp with time zone NOT NULL DEFAULT now(),
  backup_created_by uuid,
  original_id uuid NOT NULL -- ID original do registro
);

CREATE TABLE public.alunos_backup2 (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  turma_id uuid,
  idade integer,
  dias_apostila integer,
  dias_supera integer,
  ultima_correcao_ah timestamp with time zone,
  active boolean NOT NULL DEFAULT true,
  ultima_falta date,
  ultima_pagina integer,
  is_funcionario boolean DEFAULT false,
  data_onboarding timestamp with time zone,
  unit_id uuid NOT NULL,
  valor_mensalidade numeric,
  faltas_consecutivas smallint NOT NULL DEFAULT 0,
  oculto_retencoes boolean NOT NULL DEFAULT false,
  ultima_sincronizacao timestamp with time zone,
  responsavel text NOT NULL DEFAULT 'o próprio',
  whatapp_contato text,
  coordenador_responsavel text,
  pontos_atencao text,
  avaliacao_ah text,
  avaliacao_abaco text,
  motivo_procura text,
  percepcao_coordenador text,
  texto_devolutiva text,
  niveldesafio text DEFAULT '1',
  vencimento_contrato text,
  ultimo_nivel text,
  matricula text,
  curso text,
  email text,
  telefone text,
  codigo text,
  indice text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  -- Campos de controle do backup
  backup_created_at timestamp with time zone NOT NULL DEFAULT now(),
  backup_created_by uuid,
  original_id uuid NOT NULL -- ID original do registro
);

-- Criar tabelas de backup para professores (slots 1 e 2)
CREATE TABLE public.professores_backup1 (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  slack_username text,
  email text,
  telefone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  unit_id uuid NOT NULL,
  active boolean NOT NULL DEFAULT true,
  ultima_sincronizacao timestamp with time zone,
  -- Campos de controle do backup
  backup_created_at timestamp with time zone NOT NULL DEFAULT now(),
  backup_created_by uuid,
  original_id uuid NOT NULL -- ID original do registro
);

CREATE TABLE public.professores_backup2 (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  slack_username text,
  email text,
  telefone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  unit_id uuid NOT NULL,
  active boolean NOT NULL DEFAULT true,
  ultima_sincronizacao timestamp with time zone,
  -- Campos de controle do backup
  backup_created_at timestamp with time zone NOT NULL DEFAULT now(),
  backup_created_by uuid,
  original_id uuid NOT NULL -- ID original do registro
);

-- Criar tabelas de backup para turmas (slots 1 e 2)
CREATE TABLE public.turmas_backup1 (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  professor_id uuid,
  sala text,
  dia_semana dia_semana NOT NULL,
  horario_inicio text NOT NULL DEFAULT '08:00',
  horario_fim text NOT NULL DEFAULT '09:00',
  categoria text DEFAULT 'Regular',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  unit_id uuid NOT NULL,
  active boolean NOT NULL DEFAULT true,
  ultima_sincronizacao timestamp with time zone,
  -- Campos de controle do backup
  backup_created_at timestamp with time zone NOT NULL DEFAULT now(),
  backup_created_by uuid,
  original_id uuid NOT NULL -- ID original do registro
);

CREATE TABLE public.turmas_backup2 (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  professor_id uuid,
  sala text,
  dia_semana dia_semana NOT NULL,
  horario_inicio text NOT NULL DEFAULT '08:00',
  horario_fim text NOT NULL DEFAULT '09:00',
  categoria text DEFAULT 'Regular',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  unit_id uuid NOT NULL,
  active boolean NOT NULL DEFAULT true,
  ultima_sincronizacao timestamp with time zone,
  -- Campos de controle do backup
  backup_created_at timestamp with time zone NOT NULL DEFAULT now(),
  backup_created_by uuid,
  original_id uuid NOT NULL -- ID original do registro
);

-- Criar tabela de metadados dos backups
CREATE TABLE public.backup_metadata (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_number integer NOT NULL CHECK (slot_number IN (1, 2)),
  unit_id uuid NOT NULL,
  backup_name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  total_alunos integer NOT NULL DEFAULT 0,
  total_professores integer NOT NULL DEFAULT 0,
  total_turmas integer NOT NULL DEFAULT 0,
  UNIQUE(slot_number, unit_id)
);

-- Habilitar RLS nas tabelas de backup
ALTER TABLE public.alunos_backup1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos_backup2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professores_backup1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professores_backup2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas_backup1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas_backup2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_metadata ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para acesso público (como as tabelas originais)
CREATE POLICY "Acesso público para visualizar alunos backup1" ON public.alunos_backup1 FOR SELECT USING (true);
CREATE POLICY "Acesso público para inserir alunos backup1" ON public.alunos_backup1 FOR INSERT WITH CHECK (true);
CREATE POLICY "Acesso público para atualizar alunos backup1" ON public.alunos_backup1 FOR UPDATE USING (true);
CREATE POLICY "Acesso público para deletar alunos backup1" ON public.alunos_backup1 FOR DELETE USING (true);

CREATE POLICY "Acesso público para visualizar alunos backup2" ON public.alunos_backup2 FOR SELECT USING (true);
CREATE POLICY "Acesso público para inserir alunos backup2" ON public.alunos_backup2 FOR INSERT WITH CHECK (true);
CREATE POLICY "Acesso público para atualizar alunos backup2" ON public.alunos_backup2 FOR UPDATE USING (true);
CREATE POLICY "Acesso público para deletar alunos backup2" ON public.alunos_backup2 FOR DELETE USING (true);

CREATE POLICY "Acesso público para visualizar professores backup1" ON public.professores_backup1 FOR SELECT USING (true);
CREATE POLICY "Acesso público para inserir professores backup1" ON public.professores_backup1 FOR INSERT WITH CHECK (true);
CREATE POLICY "Acesso público para atualizar professores backup1" ON public.professores_backup1 FOR UPDATE USING (true);
CREATE POLICY "Acesso público para deletar professores backup1" ON public.professores_backup1 FOR DELETE USING (true);

CREATE POLICY "Acesso público para visualizar professores backup2" ON public.professores_backup2 FOR SELECT USING (true);
CREATE POLICY "Acesso público para inserir professores backup2" ON public.professores_backup2 FOR INSERT WITH CHECK (true);
CREATE POLICY "Acesso público para atualizar professores backup2" ON public.professores_backup2 FOR UPDATE USING (true);
CREATE POLICY "Acesso público para deletar professores backup2" ON public.professores_backup2 FOR DELETE USING (true);

CREATE POLICY "Acesso público para visualizar turmas backup1" ON public.turmas_backup1 FOR SELECT USING (true);
CREATE POLICY "Acesso público para inserir turmas backup1" ON public.turmas_backup1 FOR INSERT WITH CHECK (true);
CREATE POLICY "Acesso público para atualizar turmas backup1" ON public.turmas_backup1 FOR UPDATE USING (true);
CREATE POLICY "Acesso público para deletar turmas backup1" ON public.turmas_backup1 FOR DELETE USING (true);

CREATE POLICY "Acesso público para visualizar turmas backup2" ON public.turmas_backup2 FOR SELECT USING (true);
CREATE POLICY "Acesso público para inserir turmas backup2" ON public.turmas_backup2 FOR INSERT WITH CHECK (true);
CREATE POLICY "Acesso público para atualizar turmas backup2" ON public.turmas_backup2 FOR UPDATE USING (true);
CREATE POLICY "Acesso público para deletar turmas backup2" ON public.turmas_backup2 FOR DELETE USING (true);

CREATE POLICY "Acesso público para visualizar metadados backup" ON public.backup_metadata FOR SELECT USING (true);
CREATE POLICY "Acesso público para inserir metadados backup" ON public.backup_metadata FOR INSERT WITH CHECK (true);
CREATE POLICY "Acesso público para atualizar metadados backup" ON public.backup_metadata FOR UPDATE USING (true);
CREATE POLICY "Acesso público para deletar metadados backup" ON public.backup_metadata FOR DELETE USING (true);