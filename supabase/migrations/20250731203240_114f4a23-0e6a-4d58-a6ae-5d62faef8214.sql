-- Criar função para enviar webhook quando atividade "Atendimento" for criada
CREATE OR REPLACE FUNCTION send_webhook_atendimento()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  webhook_url TEXT;
  payload JSONB;
  client_data RECORD;
  unit_data RECORD;
  http_request_id BIGINT;
BEGIN
  -- Só processa se for atividade do tipo "Atendimento"
  IF NEW.tipo_atividade = 'Atendimento' THEN
    
    -- Buscar dados do cliente
    SELECT name, phone_number, observations
    INTO client_data
    FROM clients
    WHERE id = NEW.client_id;
    
    -- Buscar dados da unidade
    SELECT unit_number
    INTO unit_data
    FROM units
    WHERE id = NEW.unit_id;
    
    -- Buscar URL do webhook na tabela dados_importantes (id = 11)
    SELECT data INTO webhook_url
    FROM dados_importantes
    WHERE id = 11;
    
    -- Construir payload
    payload := jsonb_build_object(
      'scheduled_date', NEW.scheduled_date,
      'client_name', client_data.name,
      'phone_number', client_data.phone_number,
      'observations', client_data.observations,
      'unit_number', unit_data.unit_number,
      'activity_id', NEW.id,
      'created_at', NEW.created_at
    );
    
    -- Enviar requisição HTTP se temos URL
    IF webhook_url IS NOT NULL THEN
      SELECT net.http_post(
        webhook_url,
        payload::text,
        'application/json'
      ) INTO http_request_id;
      
      -- Log da operação
      RAISE NOTICE 'Webhook enviado para atendimento. Request ID: %, URL: %, Payload: %', 
        http_request_id, webhook_url, payload;
    ELSE
      RAISE WARNING 'Webhook URL não encontrada para id 11 na tabela dados_importantes';
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Criar o trigger
CREATE TRIGGER trigger_webhook_atendimento_created
  AFTER INSERT ON client_activities
  FOR EACH ROW
  EXECUTE FUNCTION send_webhook_atendimento();