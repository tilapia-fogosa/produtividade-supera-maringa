-- Criar tabela historico_whatsapp_pedagogico (replica de historico_comercial para contexto pedagógico)
CREATE TABLE public.historico_whatsapp_pedagogico (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  aluno_id UUID REFERENCES public.alunos(id),
  mensagem TEXT,
  from_me BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  lida BOOLEAN DEFAULT false,
  lida_em TIMESTAMP WITH TIME ZONE,
  tipo_mensagem TEXT,
  telefone TEXT,
  unit_id UUID NOT NULL REFERENCES public.units(id)
);

-- Índices para performance
CREATE INDEX idx_historico_whatsapp_pedagogico_aluno_id ON public.historico_whatsapp_pedagogico(aluno_id);
CREATE INDEX idx_historico_whatsapp_pedagogico_telefone ON public.historico_whatsapp_pedagogico(telefone);
CREATE INDEX idx_historico_whatsapp_pedagogico_unit_id ON public.historico_whatsapp_pedagogico(unit_id);
CREATE INDEX idx_historico_whatsapp_pedagogico_created_at ON public.historico_whatsapp_pedagogico(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.historico_whatsapp_pedagogico ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso baseadas em unit_id
CREATE POLICY "historico_whatsapp_pedagogico_select" 
ON public.historico_whatsapp_pedagogico
FOR SELECT 
USING (public.has_unit_access(unit_id));

CREATE POLICY "historico_whatsapp_pedagogico_insert" 
ON public.historico_whatsapp_pedagogico
FOR INSERT 
WITH CHECK (public.has_unit_access(unit_id));

CREATE POLICY "historico_whatsapp_pedagogico_update" 
ON public.historico_whatsapp_pedagogico
FOR UPDATE 
USING (public.has_unit_access(unit_id));

CREATE POLICY "historico_whatsapp_pedagogico_delete" 
ON public.historico_whatsapp_pedagogico
FOR DELETE 
USING (public.has_unit_access(unit_id));