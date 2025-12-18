-- Dropar função antiga para alterar tipo de retorno
DROP FUNCTION IF EXISTS get_group_messages_with_names(TEXT);

-- Recriar função com campo reaction
CREATE OR REPLACE FUNCTION get_group_messages_with_names(p_grupo_wpp_id TEXT)
RETURNS TABLE (
  id TEXT,
  grupo_id TEXT,
  mensagem TEXT,
  enviado_por TEXT,
  nome_remetente TEXT,
  nome_remetente_resolvido TEXT,
  from_me BOOLEAN,
  tipo_mensagem TEXT,
  url_media TEXT,
  created_at TIMESTAMPTZ,
  grupo_nome TEXT,
  reaction TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id::TEXT,
    h.grupo_wpp_id::TEXT as grupo_id,
    h.mensagem,
    h.enviado_por,
    h.nome_remetente,
    COALESCE(
      a.nome,
      h.nome_remetente,
      CASE 
        WHEN h.enviado_por IS NOT NULL THEN 
          CONCAT('+', REGEXP_REPLACE(SPLIT_PART(h.enviado_por, '@', 1), '^55', '55 '))
        ELSE 'Desconhecido'
      END
    ) as nome_remetente_resolvido,
    h.from_me,
    h.tipo_mensagem,
    h.url_media,
    h.created_at,
    g.grupo_nome,
    h.reaction
  FROM historico_whatsapp_grupos h
  LEFT JOIN grupos_whatsapp g ON h.grupo_wpp_id = g.grupo_wpp_id
  LEFT JOIN alunos a ON a.whatapp_contato IS NOT NULL 
    AND REGEXP_REPLACE(a.whatapp_contato, '[^0-9]', '', 'g') = SPLIT_PART(h.enviado_por, '@', 1)
  WHERE h.grupo_wpp_id = p_grupo_wpp_id
  ORDER BY h.created_at ASC;
END;
$$ LANGUAGE plpgsql;