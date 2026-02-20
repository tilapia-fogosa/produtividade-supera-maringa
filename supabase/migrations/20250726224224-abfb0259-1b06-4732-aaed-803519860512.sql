-- Função para deletar reposição
CREATE OR REPLACE FUNCTION public.delete_reposicao(p_reposicao_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Deletar a reposição
  DELETE FROM reposicoes 
  WHERE id = p_reposicao_id;
  
  -- Verificar se alguma linha foi deletada
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Retornar true se deletou com sucesso
  RETURN deleted_count > 0;
END;
$function$