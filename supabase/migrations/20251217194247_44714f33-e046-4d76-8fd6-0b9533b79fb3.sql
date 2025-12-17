-- Corrigir função get_group_messages_with_names
-- Substituir h.grupo_id por h.grupo_wpp_id (coluna correta da tabela historico_whatsapp_grupos)

CREATE OR REPLACE FUNCTION get_group_messages_with_names(p_grupo_wpp_id TEXT)
RETURNS TABLE (
  id BIGINT,
  grupo_id TEXT,
  mensagem TEXT,
  enviado_por TEXT,
  nome_remetente TEXT,
  nome_remetente_resolvido TEXT,
  from_me BOOLEAN,
  tipo_mensagem TEXT,
  url_media TEXT,
  created_at TIMESTAMPTZ,
  grupo_nome TEXT
) AS $$
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
$$ LANGUAGE plpgsql;