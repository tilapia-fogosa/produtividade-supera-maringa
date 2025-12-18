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
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enviado_por_numerico TEXT;
BEGIN
  -- Verificar se usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  RETURN QUERY
  SELECT 
    h.id::TEXT,
    h.grupo_wpp_id::TEXT as grupo_id,
    h.mensagem,
    h.enviado_por,
    h.nome_remetente,
    COALESCE(
      -- Primeiro tenta pelo whatapp_contato (com 55)
      a1.nome,
      -- Depois tenta pelo telefone (com 55)
      a2.nome,
      -- Depois tenta sem o 55 (whatapp_contato)
      a3.nome,
      -- Depois tenta sem o 55 (telefone)
      a4.nome,
      -- Se não encontrar, usa nome_remetente ou formata o número
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
  LEFT JOIN grupos_sup_mga g ON h.grupo_wpp_id = g.grupo_wpp_id
  -- Match com whatapp_contato (número completo com 55)
  LEFT JOIN alunos a1 ON a1.whatapp_contato IS NOT NULL 
    AND a1.active = true
    AND REGEXP_REPLACE(a1.whatapp_contato, '[^0-9]', '', 'g') = SPLIT_PART(h.enviado_por, '@', 1)
  -- Match com telefone (número completo com 55)
  LEFT JOIN alunos a2 ON a2.telefone IS NOT NULL 
    AND a2.active = true
    AND a1.id IS NULL
    AND REGEXP_REPLACE(a2.telefone, '[^0-9]', '', 'g') = SPLIT_PART(h.enviado_por, '@', 1)
  -- Match com whatapp_contato SEM o código do país (remove 55 do início)
  LEFT JOIN alunos a3 ON a3.whatapp_contato IS NOT NULL 
    AND a3.active = true
    AND a1.id IS NULL AND a2.id IS NULL
    AND '55' || REGEXP_REPLACE(a3.whatapp_contato, '[^0-9]', '', 'g') = SPLIT_PART(h.enviado_por, '@', 1)
  -- Match com telefone SEM o código do país (remove 55 do início)
  LEFT JOIN alunos a4 ON a4.telefone IS NOT NULL 
    AND a4.active = true
    AND a1.id IS NULL AND a2.id IS NULL AND a3.id IS NULL
    AND '55' || REGEXP_REPLACE(a4.telefone, '[^0-9]', '', 'g') = SPLIT_PART(h.enviado_por, '@', 1)
  WHERE h.grupo_wpp_id = p_grupo_wpp_id
  ORDER BY h.created_at ASC;
END;
$$;