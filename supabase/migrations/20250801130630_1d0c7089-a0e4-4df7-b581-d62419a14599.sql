-- Atualizar função para enviar POST real ao webhook
CREATE OR REPLACE FUNCTION public.send_webhook_atendimento_simples()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  webhook_url TEXT;
  payload JSONB;
  client_data RECORD;
  unit_data RECORD;
  http_request_id BIGINT;
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
    
    -- Construir payload incluindo tipo de operação
    payload := jsonb_build_object(
      'tipo_operacao', operacao_tipo,
      'scheduled_date', NEW.scheduled_date,
      'client_name', client_data.name,
      'phone_number', client_data.phone_number,
      'observations', client_data.observations,
      'unit_number', unit_data.unit_number,
      'activity_id', NEW.id,
      'created_at', NEW.created_at,
      'notes', NEW.notes,
      'tipo_contato', NEW.tipo_contato
    );
    
    -- Enviar requisição HTTP se temos URL
    IF webhook_url IS NOT NULL THEN
      SELECT net.http_post(
        webhook_url,
        payload::text,
        'application/json'
      ) INTO http_request_id;
      
      -- Log da operação
      RAISE NOTICE 'Webhook enviado para atendimento (%). Request ID: %, URL: %, Payload: %', 
        operacao_tipo, http_request_id, webhook_url, payload;
    ELSE
      RAISE WARNING 'Webhook URL não encontrada para id 11 na tabela dados_importantes';
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$function$;