-- 1. Índices para historico_comercial
CREATE INDEX IF NOT EXISTS idx_historico_comercial_telefone 
  ON public.historico_comercial (telefone);

CREATE INDEX IF NOT EXISTS idx_historico_comercial_telefone_created_at 
  ON public.historico_comercial (telefone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_historico_comercial_telefone_lida_fromme 
  ON public.historico_comercial (telefone, lida, from_me);

-- 2. Reescrever a RPC otimizada com CTEs
CREATE OR REPLACE FUNCTION public.get_commercial_conversations_by_phone()
 RETURNS TABLE(telefone text, nome_contato text, origem_nome text, ultima_mensagem text, ultima_mensagem_at timestamp with time zone, total_mensagens bigint, unread_count bigint, alterar_nome boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH 
  -- CTE 1: Agregar tudo por telefone em um único scan
  phone_stats AS (
    SELECT 
      h.telefone AS tel,
      COUNT(*) AS total_msgs,
      COUNT(*) FILTER (WHERE h.lida = false AND h.from_me = false) AS unread_cnt,
      MAX(h.created_at) AS last_msg_at
    FROM public.historico_comercial h
    WHERE h.telefone IS NOT NULL
    GROUP BY h.telefone
  ),
  -- CTE 2: Última mensagem por telefone (usando DISTINCT ON)
  last_messages AS (
    SELECT DISTINCT ON (h.telefone)
      h.telefone AS tel,
      h.mensagem AS last_msg
    FROM public.historico_comercial h
    WHERE h.telefone IS NOT NULL
    ORDER BY h.telefone, h.created_at DESC
  ),
  -- CTE 3: Normalizar telefones de alunos (1 scan)
  alunos_phones AS (
    SELECT 
      a.nome,
      RIGHT(REGEXP_REPLACE(a.whatapp_contato, '\D', '', 'g'), 10) AS phone_normalized
    FROM public.alunos a
    WHERE a.whatapp_contato IS NOT NULL AND a.whatapp_contato <> ''
  ),
  -- CTE 4: Normalizar telefones de clients (1 scan)
  clients_phones AS (
    SELECT 
      c.name,
      c.alterar_nome,
      c.lead_source,
      RIGHT(REGEXP_REPLACE(c.phone_number, '\D', '', 'g'), 10) AS phone_normalized
    FROM public.clients c
    WHERE c.phone_number IS NOT NULL AND c.phone_number <> ''
  )
  SELECT 
    ps.tel AS telefone,
    COALESCE(
      (SELECT ap.nome FROM alunos_phones ap WHERE ap.phone_normalized = RIGHT(REGEXP_REPLACE(ps.tel, '\D', '', 'g'), 10) LIMIT 1),
      (SELECT cp.name FROM clients_phones cp WHERE cp.phone_normalized = RIGHT(REGEXP_REPLACE(ps.tel, '\D', '', 'g'), 10) LIMIT 1),
      ps.tel
    ) AS nome_contato,
    CASE 
      WHEN EXISTS (SELECT 1 FROM alunos_phones ap WHERE ap.phone_normalized = RIGHT(REGEXP_REPLACE(ps.tel, '\D', '', 'g'), 10)) THEN 'aluno'
      WHEN EXISTS (SELECT 1 FROM clients_phones cp WHERE cp.phone_normalized = RIGHT(REGEXP_REPLACE(ps.tel, '\D', '', 'g'), 10)) THEN 'cliente'
      ELSE 'desconhecido'
    END AS origem_nome,
    lm.last_msg AS ultima_mensagem,
    ps.last_msg_at AS ultima_mensagem_at,
    ps.total_msgs AS total_mensagens,
    ps.unread_cnt AS unread_count,
    COALESCE(
      (SELECT cp.alterar_nome FROM clients_phones cp WHERE cp.phone_normalized = RIGHT(REGEXP_REPLACE(ps.tel, '\D', '', 'g'), 10) LIMIT 1),
      false
    ) AS alterar_nome
  FROM phone_stats ps
  LEFT JOIN last_messages lm ON lm.tel = ps.tel
  ORDER BY ps.last_msg_at DESC NULLS LAST;
END;
$function$;