-- Recriar função get_group_messages_with_names com id como text
DROP FUNCTION IF EXISTS get_group_messages_with_names(text);

CREATE OR REPLACE FUNCTION get_group_messages_with_names(p_grupo_wpp_id text)
RETURNS TABLE(
  id text,
  grupo_id text,
  mensagem text,
  enviado_por text,
  nome_remetente text,
  nome_remetente_resolvido text,
  from_me boolean,
  tipo_mensagem text,
  url_media text,
  created_at timestamp with time zone,
  grupo_nome text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.grupo_wpp_id as grupo_id,
    h.mensagem,
    h.enviado_por,
    h.nome_remetente,
    COALESCE(
      a.nome,
      h.nome_remetente,
      h.enviado_por
    ) as nome_remetente_resolvido,
    h.from_me,
    h.tipo_mensagem,
    h.url_media,
    h.created_at,
    g.grupo_nome
  FROM historico_whatsapp_grupos h
  LEFT JOIN grupos_sup_mga g ON h.grupo_wpp_id = g.grupo_wpp_id
  LEFT JOIN alunos a ON a.whatapp_contato = h.enviado_por
  WHERE h.grupo_wpp_id = p_grupo_wpp_id
  ORDER BY h.created_at ASC;
END;
$$;