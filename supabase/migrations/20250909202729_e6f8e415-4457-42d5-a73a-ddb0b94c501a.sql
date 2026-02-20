-- Corrigir schema das tabelas de backup para corresponder às tabelas originais

-- Primeiro, vamos verificar e ajustar a estrutura da tabela professores_backup1
ALTER TABLE professores_backup1 
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo'::text,
  ADD COLUMN IF NOT EXISTS slack_username text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS observacoes text;

-- Ajustar a estrutura da tabela professores_backup2
ALTER TABLE professores_backup2 
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo'::text,
  ADD COLUMN IF NOT EXISTS slack_username text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS observacoes text;

-- Ajustar a estrutura da tabela turmas_backup1
ALTER TABLE turmas_backup1 
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo'::text,
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS max_alunos integer DEFAULT 20,
  ADD COLUMN IF NOT EXISTS cor_identificacao text,
  ADD COLUMN IF NOT EXISTS whatsapp_grupo text,
  ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'Supera'::text;

-- Ajustar a estrutura da tabela turmas_backup2  
ALTER TABLE turmas_backup2 
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo'::text,
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS max_alunos integer DEFAULT 20,
  ADD COLUMN IF NOT EXISTS cor_identificacao text,
  ADD COLUMN IF NOT EXISTS whatsapp_grupo text,
  ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'Supera'::text;

-- Ajustar a estrutura da tabela alunos_backup1
ALTER TABLE alunos_backup1 
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo'::text;

-- Ajustar a estrutura da tabela alunos_backup2
ALTER TABLE alunos_backup2 
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo'::text;

-- Criar as tabelas de backup com schema completo se não existirem
CREATE TABLE IF NOT EXISTS professores_backup1 (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id uuid NOT NULL,
  backup_created_at timestamp with time zone NOT NULL DEFAULT now(),
  backup_created_by uuid,
  nome text NOT NULL,
  status text DEFAULT 'ativo'::text,
  slack_username text,
  telefone text,
  email text,
  observacoes text,
  active boolean NOT NULL DEFAULT true,
  unit_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS professores_backup2 (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id uuid NOT NULL,
  backup_created_at timestamp with time zone NOT NULL DEFAULT now(),
  backup_created_by uuid,
  nome text NOT NULL,
  status text DEFAULT 'ativo'::text,
  slack_username text,
  telefone text,
  email text,
  observacoes text,
  active boolean NOT NULL DEFAULT true,
  unit_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS turmas_backup1 (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id uuid NOT NULL,
  backup_created_at timestamp with time zone NOT NULL DEFAULT now(),
  backup_created_by uuid,
  nome text NOT NULL,
  professor_id uuid,
  dia_semana dia_semana,
  horario_inicio text,
  sala text,
  status text DEFAULT 'ativo'::text,
  observacoes text,
  max_alunos integer DEFAULT 20,
  cor_identificacao text,
  whatsapp_grupo text,
  categoria text DEFAULT 'Supera'::text,
  active boolean NOT NULL DEFAULT true,
  unit_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS turmas_backup2 (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id uuid NOT NULL,
  backup_created_at timestamp with time zone NOT NULL DEFAULT now(),
  backup_created_by uuid,
  nome text NOT NULL,
  professor_id uuid,
  dia_semana dia_semana,
  horario_inicio text,
  sala text,
  status text DEFAULT 'ativo'::text,
  observacoes text,
  max_alunos integer DEFAULT 20,
  cor_identificacao text,
  whatsapp_grupo text,
  categoria text DEFAULT 'Supera'::text,
  active boolean NOT NULL DEFAULT true,
  unit_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);