
-- Função para criar um kanban card a partir de um alerta de evasão
CREATE OR REPLACE FUNCTION public.create_kanban_card_from_alert()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  aluno_nome_var TEXT;
  column_id_var TEXT;
  historico_var TEXT;
  aula_zero_dados record;
  aula_zero_texto TEXT := '';
BEGIN
  -- Busca o nome do aluno
  SELECT nome INTO aluno_nome_var FROM alunos WHERE id = NEW.aluno_id;
  
  -- Define a coluna com base na presença de data de retenção
  IF NEW.data_retencao IS NOT NULL THEN
    column_id_var := 'scheduled';
  ELSE
    column_id_var := 'todo';
  END IF;
  
  -- Constrói o histórico com alertas anteriores do mesmo aluno
  WITH alertas_anteriores AS (
    SELECT 
      TO_CHAR(data_alerta, 'DD/MM/YYYY HH24:MI') as data_formatada,
      origem_alerta::TEXT,
      descritivo
    FROM alerta_evasao
    WHERE 
      aluno_id = NEW.aluno_id 
      AND id != NEW.id -- Exclui o alerta atual
    ORDER BY data_alerta DESC
  )
  SELECT STRING_AGG(
    data_formatada || ' - ' || origem_alerta || ': ' || COALESCE(descritivo, 'Sem descrição'),
    E'\n\n'
  ) INTO historico_var
  FROM alertas_anteriores;
  
  -- Buscar dados da Aula Zero do aluno
  SELECT 
    motivo_procura,
    percepcao_coordenador,
    avaliacao_abaco,
    avaliacao_ah,
    pontos_atencao
  INTO aula_zero_dados
  FROM alunos
  WHERE id = NEW.aluno_id;
  
  -- Construir texto com dados da Aula Zero se disponíveis
  IF aula_zero_dados IS NOT NULL THEN
    aula_zero_texto := E'\n\n=== DADOS DA AULA ZERO ===\n';
    
    IF aula_zero_dados.motivo_procura IS NOT NULL THEN
      aula_zero_texto := aula_zero_texto || E'\nMotivo da procura: ' || aula_zero_dados.motivo_procura;
    END IF;
    
    IF aula_zero_dados.percepcao_coordenador IS NOT NULL THEN
      aula_zero_texto := aula_zero_texto || E'\nPercepção do coordenador: ' || aula_zero_dados.percepcao_coordenador;
    END IF;
    
    IF aula_zero_dados.avaliacao_abaco IS NOT NULL THEN
      aula_zero_texto := aula_zero_texto || E'\nAvaliação no Ábaco: ' || aula_zero_dados.avaliacao_abaco;
    END IF;
    
    IF aula_zero_dados.avaliacao_ah IS NOT NULL THEN
      aula_zero_texto := aula_zero_texto || E'\nAvaliação no AH: ' || aula_zero_dados.avaliacao_ah;
    END IF;
    
    IF aula_zero_dados.pontos_atencao IS NOT NULL THEN
      aula_zero_texto := aula_zero_texto || E'\nPontos de atenção: ' || aula_zero_dados.pontos_atencao;
    END IF;
    
    -- Só adiciona se tiver algum dado
    IF aula_zero_texto = E'\n\n=== DADOS DA AULA ZERO ===\n' THEN
      aula_zero_texto := '';
    END IF;
  END IF;
  
  -- Combinar histórico de alertas e dados da aula zero
  IF historico_var IS NOT NULL THEN
    historico_var := historico_var || aula_zero_texto;
  ELSE
    historico_var := aula_zero_texto;
  END IF;
  
  -- Cria um novo cartão no kanban para o alerta
  INSERT INTO kanban_cards (
    alerta_evasao_id,
    column_id,
    title,
    description,
    aluno_nome,
    origem,
    responsavel,
    retention_date,
    historico
  ) VALUES (
    NEW.id,
    column_id_var,
    COALESCE('Alerta: ' || aluno_nome_var, 'Alerta de evasão'),
    NEW.descritivo,
    aluno_nome_var,
    NEW.origem_alerta::TEXT,
    NEW.responsavel,
    NEW.data_retencao,
    historico_var
  );
  
  RETURN NEW;
END;
$function$;

-- Função corrigida para notificar sobre alertas de evasão via Slack
-- A função pg_net.http_post foi atualizada com os parâmetros na ordem correta
CREATE OR REPLACE FUNCTION public.notify_evasion_alert()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  anon_key TEXT;
  req_id UUID;
  req_headers JSONB;
  req_body JSONB;
  response_status integer;
  response_body jsonb;
BEGIN
  RAISE NOTICE 'Iniciando função notify_evasion_alert para o alerta ID: %', NEW.id;
  
  -- Buscar a chave anônima da tabela dados_importantes
  SELECT data INTO anon_key
  FROM dados_importantes
  WHERE key = 'SUPABASE_ANON_KEY';
  
  IF anon_key IS NULL THEN
    RAISE WARNING 'SUPABASE_ANON_KEY não encontrada na tabela dados_importantes';
    RETURN NEW;
  END IF;

  RAISE NOTICE 'Chave anon_key encontrada, chamando edge function.';
  
  -- Preparar os headers e body para a chamada HTTP
  req_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || anon_key
  );
  
  req_body := jsonb_build_object(
    'record', row_to_json(NEW)
  );
  
  -- Chamar a edge function via HTTP usando o pg_net.http_post com a assinatura correta
  req_id := pg_net.http_post(
    url := 'https://hkvjdxxndapxpslovrlc.supabase.co/functions/v1/send-evasion-alert-slack',
    body := req_body,
    params := '{}'::jsonb,
    headers := req_headers
  );

  -- Log do ID da requisição
  RAISE NOTICE 'Requisição enviada com ID: %', req_id;
  
  -- Aguardar um curto período para garantir que a requisição foi processada
  PERFORM pg_sleep(1); -- Espera 1 segundo
  
  -- Obter a resposta da requisição
  SELECT 
    status, 
    content::jsonb 
  INTO 
    response_status, 
    response_body
  FROM 
    pg_net.http_get_response(req_id);
  
  -- Log do resultado da chamada
  RAISE NOTICE 'Edge function chamada. Status: %, Resposta: %', response_status, response_body;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, registrar o erro mas permitir que o fluxo continue
    RAISE WARNING 'Erro ao enviar alerta para Slack: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$function$;

-- Recriar o trigger para garantir uso da função atualizada
DROP TRIGGER IF EXISTS trigger_notify_evasion_alert ON alerta_evasao;

CREATE TRIGGER trigger_notify_evasion_alert
AFTER INSERT ON alerta_evasao
FOR EACH ROW
EXECUTE FUNCTION notify_evasion_alert();
