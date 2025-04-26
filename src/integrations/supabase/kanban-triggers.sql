
-- Função para criar um kanban card a partir de um alerta de evasão
CREATE OR REPLACE FUNCTION public.create_kanban_card_from_alert()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  aluno_nome_var TEXT;
  column_id_var TEXT;
BEGIN
  -- Busca o nome do aluno
  SELECT nome INTO aluno_nome_var FROM alunos WHERE id = NEW.aluno_id;
  
  -- Define a coluna com base na presença de data de retenção
  IF NEW.data_retencao IS NOT NULL THEN
    column_id_var := 'scheduled';
  ELSE
    column_id_var := 'todo';
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
    retention_date
  ) VALUES (
    NEW.id,
    column_id_var,
    COALESCE('Alerta: ' || aluno_nome_var, 'Alerta de evasão'),
    NEW.descritivo,
    aluno_nome_var,
    NEW.origem_alerta::TEXT,
    NEW.responsavel,
    NEW.data_retencao
  );
  
  RETURN NEW;
END;
$function$;
