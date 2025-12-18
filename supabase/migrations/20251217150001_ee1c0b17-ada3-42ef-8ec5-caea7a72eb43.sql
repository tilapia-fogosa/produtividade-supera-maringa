-- Função RPC para buscar mensagens de grupo com nome do aluno resolvido
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
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.grupo_id,
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
  LEFT JOIN grupos_sup_mga g ON h.grupo_id = g.grupo_wpp_id
  LEFT JOIN alunos a ON (
    REPLACE(REPLACE(REPLACE(a.telefone, ' ', ''), '-', ''), '(', '') = SUBSTRING(h.enviado_por FROM 3)
    OR REPLACE(REPLACE(REPLACE(a.whatapp_contato, ' ', ''), '-', ''), '(', '') = SUBSTRING(h.enviado_por FROM 3)
    OR REPLACE(REPLACE(REPLACE(a.telefone, ' ', ''), '-', ''), '(', '') LIKE '%' || SUBSTRING(h.enviado_por FROM 5) || '%'
    OR REPLACE(REPLACE(REPLACE(a.whatapp_contato, ' ', ''), '-', ''), '(', '') LIKE '%' || SUBSTRING(h.enviado_por FROM 5) || '%'
  )
  WHERE h.grupo_id = p_grupo_wpp_id
  ORDER BY h.created_at ASC;
END;
$$;

-- Função RPC para buscar grupos com última mensagem
CREATE OR REPLACE FUNCTION get_groups_with_last_message()
RETURNS TABLE (
  id UUID,
  grupo_nome TEXT,
  grupo_wpp_id TEXT,
  turma_id UUID,
  ultima_mensagem TEXT,
  ultima_mensagem_at TIMESTAMPTZ,
  total_mensagens BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
      WHERE h.grupo_id = g.grupo_wpp_id 
      ORDER BY h.created_at DESC 
      LIMIT 1
    ) as ultima_mensagem,
    (
      SELECT h.created_at 
      FROM historico_whatsapp_grupos h 
      WHERE h.grupo_id = g.grupo_wpp_id 
      ORDER BY h.created_at DESC 
      LIMIT 1
    ) as ultima_mensagem_at,
    (
      SELECT COUNT(*) 
      FROM historico_whatsapp_grupos h 
      WHERE h.grupo_id = g.grupo_wpp_id
    ) as total_mensagens
  FROM grupos_sup_mga g
  ORDER BY ultima_mensagem_at DESC NULLS LAST;
END;
$$;