-- Dropar função existente e recriar com DISTINCT ON
DROP FUNCTION IF EXISTS get_groups_with_last_message();

CREATE OR REPLACE FUNCTION get_groups_with_last_message()
RETURNS TABLE(
  id uuid,
  grupo_nome text,
  grupo_wpp_id text,
  turma_id uuid,
  ultima_mensagem text,
  ultima_mensagem_at timestamptz,
  total_mensagens bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (g.grupo_wpp_id)
    g.id,
    g.grupo_nome,
    g.grupo_wpp_id,
    g.turma_id,
    (
      SELECT m.mensagem 
      FROM mensagens_grupos_sup_mga m 
      WHERE m.grupo_id = g.grupo_wpp_id 
      ORDER BY m.created_at DESC 
      LIMIT 1
    ) as ultima_mensagem,
    (
      SELECT m.created_at 
      FROM mensagens_grupos_sup_mga m 
      WHERE m.grupo_id = g.grupo_wpp_id 
      ORDER BY m.created_at DESC 
      LIMIT 1
    ) as ultima_mensagem_at,
    (
      SELECT COUNT(*) 
      FROM mensagens_grupos_sup_mga m 
      WHERE m.grupo_id = g.grupo_wpp_id
    ) as total_mensagens
  FROM grupos_sup_mga g
  ORDER BY g.grupo_wpp_id, g.created_at DESC;
END;
$$;