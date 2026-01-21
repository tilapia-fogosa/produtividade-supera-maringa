
-- Criar função para criar atividade de acolhimento automaticamente
CREATE OR REPLACE FUNCTION public.criar_atividade_acolhimento_automatica()
RETURNS TRIGGER AS $$
DECLARE
  v_professor_id UUID;
  v_professor_nome TEXT;
  v_descricao TEXT;
BEGIN
  -- Buscar o professor da turma do aluno
  SELECT p.id, p.nome INTO v_professor_id, v_professor_nome
  FROM alunos a
  LEFT JOIN turmas t ON a.turma_id = t.id
  LEFT JOIN professores p ON t.professor_id = p.id
  WHERE a.id = NEW.aluno_id;

  -- Usar o descritivo do alerta ou um texto padrão
  v_descricao := COALESCE(NEW.descritivo, 'Atividade de acolhimento criada automaticamente');

  -- Inserir a atividade de acolhimento
  INSERT INTO public.atividades_alerta_evasao (
    alerta_evasao_id,
    tipo_atividade,
    descricao,
    responsavel_id,
    responsavel_nome
  ) VALUES (
    NEW.id,
    'acolhimento',
    v_descricao,
    NULL,
    COALESCE(v_professor_nome, 'Sistema')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para executar após inserção de alerta de evasão
DROP TRIGGER IF EXISTS trigger_criar_atividade_acolhimento ON public.alerta_evasao;
CREATE TRIGGER trigger_criar_atividade_acolhimento
  AFTER INSERT ON public.alerta_evasao
  FOR EACH ROW
  EXECUTE FUNCTION public.criar_atividade_acolhimento_automatica();
