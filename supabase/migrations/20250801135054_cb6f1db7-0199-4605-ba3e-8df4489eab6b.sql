-- Desabilitar os triggers problemáticos que estão causando falhas
DROP TRIGGER IF EXISTS trigger_webhook_atendimento_created ON client_activities;
DROP TRIGGER IF EXISTS trigger_webhook_atendimento_test ON client_activities;
DROP TRIGGER IF EXISTS webhook_atendimento_trigger ON client_activities;
DROP TRIGGER IF EXISTS webhook_atendimento_simples_trigger ON client_activities;