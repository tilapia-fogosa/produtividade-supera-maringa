
-- Função melhorada para notificar sobre alertas de evasão via Slack
CREATE OR REPLACE FUNCTION public.notify_evasion_alert()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  req_id BIGINT;
  response RECORD;
  supabase_url TEXT;
  anon_key TEXT;
  payload TEXT;
  aluno_nome TEXT;
  turma_nome TEXT := 'Não informada';
  professor_nome TEXT := 'Não informado';
  professor_slack TEXT := NULL;
  dia_semana_texto TEXT;
  card_id TEXT;
BEGIN
  RAISE NOTICE 'Iniciando função notify_evasion_alert para o alerta ID: %', NEW.id;
  
  -- Usar valores hardcoded para as credenciais
  -- O URL do projeto Supabase é definido automaticamente como variável de ambiente
  supabase_url := 'https://hkvjdxxndapxpslovrlc.supabase.co';
  
  -- Usar a chave anon diretamente - ela é pública e pode ser hardcoded
  anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrdmpkeHhuZGFweHBzbG92cmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1OTA2MDcsImV4cCI6MjA1ODE2NjYwN30.wuocrBFksyYuPGQm4UKcGzQx94PwFXCxdrb_pG5-N08';

  RAISE NOTICE 'URL Supabase: %', supabase_url;
  RAISE NOTICE 'Usando anon_key: %...', LEFT(anon_key, 10);
  
  -- Buscar nome do aluno e dados completos da turma
  SELECT 
    a.nome, 
    t.nome, 
    t.dia_semana,
    p.nome, 
    p.slack_username
  INTO 
    aluno_nome,
    turma_nome, 
    dia_semana_texto,
    professor_nome, 
    professor_slack
  FROM alunos a
  LEFT JOIN turmas t ON a.turma_id = t.id
  LEFT JOIN professores p ON t.professor_id = p.id
  WHERE a.id = NEW.aluno_id;
  
  -- Usar o nome da turma como está no banco (já inclui horário e outras informações)
  IF turma_nome IS NOT NULL THEN
    RAISE NOTICE 'Turma: %', turma_nome;
  ELSE
    turma_nome := 'Turma não encontrada';
  END IF;

  -- Obter o ID do cartão Kanban criado para este alerta
  SELECT id INTO card_id
  FROM kanban_cards
  WHERE alerta_evasao_id = NEW.id
  LIMIT 1;
  
  RAISE NOTICE 'ID do cartão Kanban associado: %', card_id;
  
  -- Construir payload no formato que a edge function enviarMensagemSlack espera
  payload := jsonb_build_object(
    'aluno', aluno_nome,
    'alunoId', NEW.aluno_id,  -- Enviamos o ID do aluno para busca dinâmica
    'dataAlerta', TO_CHAR(NEW.data_alerta, 'DD/MM/YYYY'),
    'responsavel', NEW.responsavel,
    'descritivo', NEW.descritivo,
    'origem', NEW.origem_alerta,
    'dataRetencao', CASE WHEN NEW.data_retencao IS NOT NULL THEN TO_CHAR(NEW.data_retencao, 'DD/MM/YYYY') ELSE '' END,
    'turma', turma_nome,
    'professor', professor_nome,
    'professorSlack', professor_slack,
    'username', 'Sistema Kadin',
    'cardId', card_id
  )::text;
  
  RAISE NOTICE 'Payload preparado: %', payload;
  
  BEGIN
    -- Chamada HTTP para a edge function com os parâmetros na ordem correta
    -- URL, body, params, headers
    BEGIN
      req_id := net.http_post(
        supabase_url || '/functions/v1/enviarMensagemSlack',
        payload,
        '{}'::jsonb,
        jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || anon_key
        )
      );

      RAISE NOTICE 'Requisição enviada com ID: %', req_id;
      
      -- Aguardar um período mais longo para garantir que a requisição foi processada
      PERFORM pg_sleep(5); -- Aumentado para 5 segundos para dar mais tempo
      
      -- Tentar obter a resposta 
      BEGIN
        SELECT * INTO response FROM net.http_get_response(req_id);
        
        RAISE NOTICE 'Edge function chamada. Status: %, Resposta: %', 
                   response.status_code, response.content;
                   
        -- Verificar se o status code indica erro
        IF response.status_code >= 400 THEN
          RAISE WARNING 'Erro na resposta da API: status code %', response.status_code;
        END IF;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Erro ao obter resposta: %, SQLSTATE: %', SQLERRM, SQLSTATE;
          RAISE NOTICE 'Resposta ainda não disponível, mas a requisição foi enviada.';
      END;
    EXCEPTION
      WHEN OTHERS THEN
        -- Em caso de erro na chamada HTTP, registrar o erro
        RAISE WARNING 'Erro ao chamar a edge function: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    END;
  EXCEPTION
    WHEN OTHERS THEN
      -- Em caso de erro, registrar o erro mas permitir que o fluxo continue
      RAISE WARNING 'Erro ao enviar alerta para Slack: %, SQLSTATE: %', SQLERRM, SQLSTATE;
  END;
  
  RETURN NEW;
END;
$function$;
