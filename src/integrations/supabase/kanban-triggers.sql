
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
BEGIN
  RAISE NOTICE 'Iniciando função notify_evasion_alert para o alerta ID: %', NEW.id;
  
  -- Usar valores hardcoded para as credenciais
  -- O URL do projeto Supabase é definido automaticamente como variável de ambiente
  supabase_url := 'https://hkvjdxxndapxpslovrlc.supabase.co';
  
  -- Usar a chave anon diretamente - ela é pública e pode ser hardcoded
  anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrdmpkeHhuZGFweHBzbG92cmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1OTA2MDcsImV4cCI6MjA1ODE2NjYwN30.wuocrBFksyYuPGQm4UKcGzQx94PwFXCxdrb_pG5-N08';

  RAISE NOTICE 'URL Supabase: %', supabase_url;
  RAISE NOTICE 'Usando anon_key: %...', LEFT(anon_key, 10);
  
  -- Buscar nome do aluno
  SELECT nome INTO aluno_nome 
  FROM alunos 
  WHERE id = NEW.aluno_id;
  
  -- Buscar informações de turma e professor
  SELECT 
    t.nome, 
    p.nome, 
    p.slack_username
  INTO 
    turma_nome, 
    professor_nome, 
    professor_slack
  FROM alunos a
  LEFT JOIN turmas t ON a.turma_id = t.id
  LEFT JOIN professores p ON t.professor_id = p.id
  WHERE a.id = NEW.aluno_id;
  
  -- Construir payload no formato que a edge function enviarMensagemSlack espera
  payload := jsonb_build_object(
    'aluno', aluno_nome,
    'dataAlerta', TO_CHAR(NEW.data_alerta, 'DD/MM/YYYY'),
    'responsavel', NEW.responsavel,
    'descritivo', NEW.descritivo,
    'origem', NEW.origem_alerta,
    'dataRetencao', CASE WHEN NEW.data_retencao IS NOT NULL THEN TO_CHAR(NEW.data_retencao, 'DD/MM/YYYY') ELSE '' END,
    'turma', turma_nome,
    'professor', professor_nome,
    'professorSlack', professor_slack,
    'username', 'Sistema Kadin'
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

-- Recriar o trigger para garantir uso da função atualizada
DROP TRIGGER IF EXISTS trigger_notify_evasion_alert ON alerta_evasao;

CREATE TRIGGER trigger_notify_evasion_alert
AFTER INSERT ON alerta_evasao
FOR EACH ROW
EXECUTE FUNCTION notify_evasion_alert();

