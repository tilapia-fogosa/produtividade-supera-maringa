-- Adicionar campo active na tabela aulas_experimentais
ALTER TABLE aulas_experimentais 
ADD COLUMN active BOOLEAN DEFAULT true;

-- Atualizar registros existentes para serem ativos
UPDATE aulas_experimentais 
SET active = true 
WHERE active IS NULL;

-- Função para buscar lista completa de aulas experimentais ativas
CREATE OR REPLACE FUNCTION public.get_lista_aulas_experimentais()
RETURNS TABLE(
  aula_experimental_id uuid,
  data_aula_experimental date,
  cliente_nome text,
  responsavel_nome text,
  responsavel_tipo text,
  descricao_cliente text,
  turma_nome text,
  unit_id uuid,
  turma_id uuid,
  responsavel_id uuid
)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ae.id as aula_experimental_id,
    ae.data_aula_experimental,
    ae.cliente_nome,
    CASE 
      WHEN ae.responsavel_tipo = 'professor' THEN prof.nome
      WHEN ae.responsavel_tipo = 'funcionario' THEN func.nome
      ELSE 'Não identificado'
    END as responsavel_nome,
    ae.responsavel_tipo,
    ae.descricao_cliente,
    t.nome as turma_nome,
    ae.unit_id,
    ae.turma_id,
    ae.responsavel_id
  FROM aulas_experimentais ae
  JOIN turmas t ON ae.turma_id = t.id
  LEFT JOIN professores prof ON ae.responsavel_id::text = prof.id::text AND ae.responsavel_tipo = 'professor'
  LEFT JOIN funcionarios func ON ae.responsavel_id::text = func.id::text AND ae.responsavel_tipo = 'funcionario'
  WHERE ae.active = true
  ORDER BY ae.data_aula_experimental DESC, ae.cliente_nome ASC;
END;
$function$;

-- Função para deletar aula experimental (exclusão lógica)
CREATE OR REPLACE FUNCTION public.delete_aula_experimental(p_aula_experimental_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  deleted_count INTEGER;
  aula_data DATE;
BEGIN
  -- Verificar se a aula experimental existe e buscar a data
  SELECT data_aula_experimental INTO aula_data
  FROM aulas_experimentais 
  WHERE id = p_aula_experimental_id AND active = true;
  
  -- Se não encontrou a aula experimental
  IF aula_data IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar se a data é futura (d+1)
  IF aula_data <= CURRENT_DATE THEN
    RAISE EXCEPTION 'Não é possível excluir aulas experimentais do dia atual ou passadas';
  END IF;
  
  -- Fazer exclusão lógica
  UPDATE aulas_experimentais 
  SET active = false
  WHERE id = p_aula_experimental_id;
  
  -- Verificar se alguma linha foi atualizada
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Retornar true se atualizou com sucesso
  RETURN deleted_count > 0;
END;
$function$;