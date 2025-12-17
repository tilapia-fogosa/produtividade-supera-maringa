-- Corrigir a função para usar os tipos corretos
DROP FUNCTION IF EXISTS get_groups_with_last_message();

CREATE OR REPLACE FUNCTION get_groups_with_last_message()
RETURNS TABLE (
  id bigint,
  grupo_nome text,
  grupo_wpp_id text,
  turma_id text,
  ultima_mensagem text,
  ultima_mensagem_at timestamptz,
  total_mensagens bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.grupo_nome,
    g.grupo_wpp_id,
    g.turma_id,
    (
      SELECT h.mensagem
      FROM historico_whatsapp_grupos h
      WHERE h.grupo_wpp_id = g.grupo_wpp_id
      ORDER BY h.created_at DESC
      LIMIT 1
    ) as ultima_mensagem,
    (
      SELECT h.created_at
      FROM historico_whatsapp_grupos h
      WHERE h.grupo_wpp_id = g.grupo_wpp_id
      ORDER BY h.created_at DESC
      LIMIT 1
    ) as ultima_mensagem_at,
    (
      SELECT COUNT(*)
      FROM historico_whatsapp_grupos h
      WHERE h.grupo_wpp_id = g.grupo_wpp_id
    ) as total_mensagens
  FROM grupos_sup_mga g
  ORDER BY ultima_mensagem_at DESC NULLS LAST;
END;
$$;