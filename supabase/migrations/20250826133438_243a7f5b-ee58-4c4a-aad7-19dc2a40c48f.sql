-- Criar tabela clients_backup como cópia da estrutura da tabela clients
CREATE TABLE public.clients_backup (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  name text NOT NULL,
  phone_number text NOT NULL,
  email text,
  lead_source text NOT NULL,
  observations text,
  created_by uuid,
  status text NOT NULL DEFAULT 'novo-cadastro'::text,
  deleted_at timestamp with time zone,
  next_contact_date timestamp with time zone,
  scheduled_date timestamp with time zone,
  active boolean NOT NULL DEFAULT true,
  unit_id uuid,
  lead_quality_score integer,
  valorization_confirmed boolean DEFAULT false,
  tipo_atendimento tipo_atendimento NOT NULL DEFAULT 'humano'::tipo_atendimento,
  concatena boolean DEFAULT false,
  concatena_tempo timestamp with time zone,
  etapa_bot "etapa-do-bot" DEFAULT 'apresentador'::"etapa-do-bot",
  msg_concatenada text[] NOT NULL DEFAULT '{}'::text[],
  primeiro_nome text,
  registration_name text,
  registration_cpf text,
  original_ad text,
  original_adset text,
  meta_id text,
  age_range text,
  resumo_atendimento text DEFAULT '""'::text,
  unit_api_key uuid
);

-- Comentário da tabela
COMMENT ON TABLE public.clients_backup IS 'Tabela de backup dos clientes antes de operações em massa';

-- Habilitar RLS
ALTER TABLE public.clients_backup ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso para admins
CREATE POLICY "Admins podem gerenciar backup de clientes" ON public.clients_backup
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);