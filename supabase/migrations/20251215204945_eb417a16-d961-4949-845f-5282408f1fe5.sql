-- Criar tabela para mensagens de grupos WhatsApp
CREATE TABLE historico_whatsapp_grupos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  grupo_id BIGINT NOT NULL REFERENCES grupos_sup_mga(id),
  mensagem TEXT,
  enviado_por TEXT, -- telefone de quem enviou
  nome_remetente TEXT, -- nome do remetente (fallback se não encontrar na tabela alunos)
  from_me BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  tipo_mensagem TEXT DEFAULT 'text',
  unit_id UUID NOT NULL REFERENCES units(id)
);

-- Índices para performance
CREATE INDEX idx_historico_whatsapp_grupos_grupo_id ON historico_whatsapp_grupos(grupo_id);
CREATE INDEX idx_historico_whatsapp_grupos_enviado_por ON historico_whatsapp_grupos(enviado_por);
CREATE INDEX idx_historico_whatsapp_grupos_unit_id ON historico_whatsapp_grupos(unit_id);
CREATE INDEX idx_historico_whatsapp_grupos_created_at ON historico_whatsapp_grupos(created_at DESC);

-- Habilitar RLS
ALTER TABLE historico_whatsapp_grupos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso baseadas em unit_id
CREATE POLICY "historico_whatsapp_grupos_select" ON historico_whatsapp_grupos
  FOR SELECT USING (has_unit_access(unit_id));

CREATE POLICY "historico_whatsapp_grupos_insert" ON historico_whatsapp_grupos
  FOR INSERT WITH CHECK (has_unit_access(unit_id));

CREATE POLICY "historico_whatsapp_grupos_update" ON historico_whatsapp_grupos
  FOR UPDATE USING (has_unit_access(unit_id));

CREATE POLICY "historico_whatsapp_grupos_delete" ON historico_whatsapp_grupos
  FOR DELETE USING (has_unit_access(unit_id));