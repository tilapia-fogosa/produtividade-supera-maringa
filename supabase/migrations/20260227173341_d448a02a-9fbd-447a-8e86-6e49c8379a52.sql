DROP FUNCTION IF EXISTS public.get_commercial_messages_by_phone(text);

CREATE OR REPLACE FUNCTION public.get_commercial_messages_by_phone(p_telefone text)
RETURNS TABLE(
  id bigint,
  telefone text,
  mensagem text,
  tipo_mensagem text,
  from_me boolean,
  created_at timestamptz,
  client_id uuid,
  url_media text,
  created_by_name text,
  quoted_message_id bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    h.media_url as url_media,
    p.full_name as created_by_name,
    h.quoted_message_id
  FROM public.historico_comercial h
  LEFT JOIN public.profiles p ON h.created_by = p.id
  WHERE RIGHT(REGEXP_REPLACE(h.telefone, '\D', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(p_telefone, '\D', '', 'g'), 10)
  ORDER BY h.created_at ASC;
END;
$$;