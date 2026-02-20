-- Adicionar campos para rastreamento do envio de alertas para o Slack
ALTER TABLE alertas_falta ADD COLUMN IF NOT EXISTS slack_enviado BOOLEAN DEFAULT false;
ALTER TABLE alertas_falta ADD COLUMN IF NOT EXISTS slack_erro TEXT;
ALTER TABLE alertas_falta ADD COLUMN IF NOT EXISTS slack_enviado_em TIMESTAMP WITH TIME ZONE;