-- Dropar a função existente usando a assinatura correta
DROP FUNCTION IF EXISTS public.get_groups_with_last_message();

-- Recriar com o campo unread_count
CREATE FUNCTION public.get_groups_with_last_message()
RETURNS TABLE (
  id bigint,
  grupo_nome text,
  grupo_wpp_id text,
  turma_id text,
  ultima_mensagem text,
  ultima_mensagem_at timestamptz,
  total_mensagens bigint,
  unread_count bigint
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
    ) as total_mensagens,
    (
      SELECT COUNT(*) 
      FROM historico_whatsapp_grupos h 
      WHERE h.grupo_wpp_id = g.grupo_wpp_id 
        AND h.lida = false 
        AND h.from_me = false
    ) as unread_count
  FROM grupos_sup_mga g
  ORDER BY ultima_mensagem_at DESC NULLS LAST;
END;
$$;