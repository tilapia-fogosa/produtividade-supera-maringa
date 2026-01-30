
-- Corrigir a função para incluir o professor_responsavel_id
CREATE OR REPLACE FUNCTION public.criar_atividade_acolhimento_automatica()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_professor_id UUID;
  v_professor_nome TEXT;
  v_descricao TEXT;
  v_data_hoje DATE;
BEGIN
  -- Buscar o professor da turma do aluno
  SELECT p.id, p.nome INTO v_professor_id, v_professor_nome
  FROM alunos a
  LEFT JOIN turmas t ON a.turma_id = t.id
  LEFT JOIN professores p ON t.professor_id = p.id
  WHERE a.id = NEW.aluno_id;

  -- Usar o descritivo do alerta ou um texto padrão
  v_descricao := COALESCE(NEW.descritivo, 'Atividade de acolhimento criada automaticamente');
  
  -- Data de hoje para data_agendada
  v_data_hoje := CURRENT_DATE;

  -- Inserir a atividade de acolhimento COM o professor_responsavel_id
  INSERT INTO public.atividades_alerta_evasao (
    alerta_evasao_id,
    tipo_atividade,
    descricao,
    responsavel_id,
    responsavel_nome,
    professor_responsavel_id,
    data_agendada,
    status
  ) VALUES (
    NEW.id,
    'acolhimento',
    v_descricao,
    NULL,
    COALESCE(v_professor_nome, 'Sistema'),
    v_professor_id,  -- CORREÇÃO: Agora inclui o ID do professor!
    v_data_hoje,
    'pendente'
  );

  RETURN NEW;
END;
$function$;

-- Corrigir atividades existentes que estão sem professor_responsavel_id
UPDATE atividades_alerta_evasao aae
SET professor_responsavel_id = p.id
FROM alerta_evasao ae
JOIN alunos a ON ae.aluno_id = a.id
JOIN turmas t ON a.turma_id = t.id
JOIN professores p ON t.professor_id = p.id
WHERE aae.alerta_evasao_id = ae.id
  AND aae.tipo_atividade IN ('acolhimento', 'atendimento_pedagogico')
  AND aae.professor_responsavel_id IS NULL
  AND p.id IS NOT NULL;
