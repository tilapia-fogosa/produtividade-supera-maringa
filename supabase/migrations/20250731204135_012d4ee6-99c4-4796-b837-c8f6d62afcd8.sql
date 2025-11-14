-- Função simplificada para teste do webhook
CREATE OR REPLACE FUNCTION public.send_webhook_atendimento_simples()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Log simples para verificar se o trigger está funcionando
  RAISE NOTICE 'Trigger executado para client_id: %, tipo_atividade: %', NEW.client_id, NEW.tipo_atividade;
  
  -- Só processa se for atividade do tipo "Atendimento"
  IF NEW.tipo_atividade = 'Atendimento' THEN
    RAISE NOTICE 'Processando webhook para atendimento...';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Remover trigger antigo e criar um novo com a função simplificada
DROP TRIGGER IF EXISTS trigger_webhook_atendimento_created ON client_activities;

-- Criar trigger com função simplificada para teste
CREATE TRIGGER trigger_webhook_atendimento_test
  AFTER INSERT ON client_activities
  FOR EACH ROW
  EXECUTE FUNCTION send_webhook_atendimento_simples();