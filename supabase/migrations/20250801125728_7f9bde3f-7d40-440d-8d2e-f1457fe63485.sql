-- Função atualizada para detectar INSERT e UPDATE
CREATE OR REPLACE FUNCTION public.send_webhook_atendimento_simples()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  operacao_tipo TEXT;
BEGIN
  -- Determinar o tipo de operação
  operacao_tipo := CASE 
    WHEN TG_OP = 'INSERT' THEN 'criação'
    WHEN TG_OP = 'UPDATE' THEN 'atualização'
    ELSE TG_OP
  END;
  
  -- Log com tipo de operação
  RAISE NOTICE 'Trigger executado (%) para client_id: %, tipo_atividade: %', 
    operacao_tipo, NEW.client_id, NEW.tipo_atividade;
  
  -- Só processa se for atividade do tipo "Atendimento"
  IF NEW.tipo_atividade = 'Atendimento' THEN
    RAISE NOTICE 'Processando webhook para atendimento (operação: %)...', operacao_tipo;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Remover trigger atual e criar um novo para INSERT e UPDATE
DROP TRIGGER IF EXISTS trigger_webhook_atendimento_test ON client_activities;

-- Criar trigger para INSERT e UPDATE
CREATE TRIGGER trigger_webhook_atendimento_test
  AFTER INSERT OR UPDATE ON client_activities
  FOR EACH ROW
  EXECUTE FUNCTION send_webhook_atendimento_simples();