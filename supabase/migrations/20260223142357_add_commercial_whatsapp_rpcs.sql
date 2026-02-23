-- Migration para adicionar funções RPC do WhatsApp Comercial

-- Função 1: Buscar a listagem de conversas consolidadas por telefone
CREATE OR REPLACE FUNCTION get_commercial_conversations_by_phone()
RETURNS TABLE (
  telefone text,
  nome_contato text,
  origem_nome text,
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
  WITH unique_phones AS (
    SELECT DISTINCT h.telefone as tel 
    FROM public.historico_comercial h 
    WHERE h.telefone IS NOT NULL
  )
  SELECT 
    up.tel as telefone,
    COALESCE(
      (SELECT a.nome FROM public.alunos a WHERE RIGHT(REGEXP_REPLACE(a.whatapp_contato, '\D', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(up.tel, '\D', '', 'g'), 10) LIMIT 1),
      (SELECT c.name FROM public.clients c WHERE RIGHT(REGEXP_REPLACE(c.phone_number, '\D', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(up.tel, '\D', '', 'g'), 10) LIMIT 1),
      up.tel
    ) as nome_contato,
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.alunos a WHERE RIGHT(REGEXP_REPLACE(a.whatapp_contato, '\D', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(up.tel, '\D', '', 'g'), 10)) THEN 'aluno'
      WHEN EXISTS (SELECT 1 FROM public.clients c WHERE RIGHT(REGEXP_REPLACE(c.phone_number, '\D', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(up.tel, '\D', '', 'g'), 10)) THEN 'cliente'
      ELSE 'desconhecido'
    END as origem_nome,
    (SELECT h.mensagem FROM public.historico_comercial h WHERE h.telefone = up.tel ORDER BY h.created_at DESC LIMIT 1) as ultima_mensagem,
    (SELECT h.created_at FROM public.historico_comercial h WHERE h.telefone = up.tel ORDER BY h.created_at DESC LIMIT 1) as ultima_mensagem_at,
    (SELECT COUNT(*) FROM public.historico_comercial h WHERE h.telefone = up.tel) as total_mensagens,
    (SELECT COUNT(*) FROM public.historico_comercial h WHERE h.telefone = up.tel AND h.lida = false AND h.from_me = false) as unread_count
  FROM unique_phones up
  ORDER BY ultima_mensagem_at DESC NULLS LAST;
END;
$$;


-- Função 2: Buscar as mensagens de uma conversa específica baseada no telefone flexível
CREATE OR REPLACE FUNCTION get_commercial_messages_by_phone(p_telefone text)
RETURNS TABLE (
  id bigint,
  telefone text,
  mensagem text,
  tipo_mensagem text,
  from_me boolean,
  created_at timestamptz,
  client_id uuid,
  url_media text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.telefone,
    h.mensagem,
    h.tipo_mensagem,
    h.from_me,
    h.created_at,
    h.client_id,
    h.media_url as url_media
  FROM public.historico_comercial h
  WHERE RIGHT(REGEXP_REPLACE(h.telefone, '\D', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(p_telefone, '\D', '', 'g'), 10)
  ORDER BY h.created_at ASC;
END;
$$;
