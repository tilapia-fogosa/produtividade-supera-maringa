-- Corrigir função RPC para resolver ambiguidade na coluna status
CREATE OR REPLACE FUNCTION public.get_alunos_retencoes_historico(
    p_search_term TEXT DEFAULT '',
    p_status_filter TEXT DEFAULT 'todos',
    p_incluir_ocultos BOOLEAN DEFAULT false
)
RETURNS TABLE (
    id UUID,
    nome TEXT,
    turma TEXT,
    educador TEXT,
    total_alertas BIGINT,
    alertas_ativos BIGINT,
    total_retencoes BIGINT,
    ultimo_alerta TIMESTAMP WITH TIME ZONE,
    ultima_retencao TIMESTAMP WITH TIME ZONE,
    status TEXT,
    oculto_retencoes BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH alunos_dados AS (
        SELECT 
            a.id,
            a.nome,
            COALESCE(t.nome, 'Sem turma') as turma_nome,
            COALESCE(p.nome, 'Sem professor') as professor_nome,
            a.oculto_retencoes,
            -- Contar alertas
            COALESCE(alertas_count.total_alertas, 0) as total_alertas,
            COALESCE(alertas_count.alertas_ativos, 0) as alertas_ativos,
            -- Contar retenções
            COALESCE(retencoes_count.total_retencoes, 0) as total_retencoes,
            -- Última data de alerta
            alertas_recentes.ultimo_alerta,
            -- Última data de retenção
            retencoes_recentes.ultima_retencao
        FROM alunos a
        LEFT JOIN turmas t ON a.turma_id = t.id
        LEFT JOIN professores p ON t.professor_id = p.id
        LEFT JOIN (
            SELECT 
                ae.aluno_id,
                COUNT(*) as total_alertas,
                COUNT(*) FILTER (WHERE ae.status = 'pendente' OR ae.status = 'em_andamento') as alertas_ativos
            FROM alerta_evasao ae
            GROUP BY ae.aluno_id
        ) alertas_count ON a.id = alertas_count.aluno_id
        LEFT JOIN (
            SELECT 
                r.aluno_id,
                COUNT(*) as total_retencoes
            FROM retencoes r
            GROUP BY r.aluno_id
        ) retencoes_count ON a.id = retencoes_count.aluno_id
        LEFT JOIN (
            SELECT DISTINCT ON (ae2.aluno_id)
                ae2.aluno_id,
                ae2.created_at as ultimo_alerta
            FROM alerta_evasao ae2
            ORDER BY ae2.aluno_id, ae2.created_at DESC
        ) alertas_recentes ON a.id = alertas_recentes.aluno_id
        LEFT JOIN (
            SELECT DISTINCT ON (r2.aluno_id)
                r2.aluno_id,
                r2.created_at as ultima_retencao
            FROM retencoes r2
            ORDER BY r2.aluno_id, r2.created_at DESC
        ) retencoes_recentes ON a.id = retencoes_recentes.aluno_id
        WHERE a.active = true
        AND (p_incluir_ocultos = true OR a.oculto_retencoes = false)
    ),
    alunos_com_status AS (
        SELECT 
            ad.*,
            CASE 
                WHEN ad.alertas_ativos >= 3 THEN 'critico'
                WHEN ad.alertas_ativos > 0 THEN 'alerta'
                WHEN ad.total_retencoes > 0 THEN 'retencao'
                ELSE 'normal'
            END as calculated_status
        FROM alunos_dados ad
    )
    SELECT 
        acs.id,
        acs.nome,
        acs.turma_nome as turma,
        acs.professor_nome as educador,
        acs.total_alertas,
        acs.alertas_ativos,
        acs.total_retencoes,
        acs.ultimo_alerta,
        acs.ultima_retencao,
        acs.calculated_status as status,
        acs.oculto_retencoes
    FROM alunos_com_status acs
    WHERE 
        -- Filtro de busca por nome
        (p_search_term = '' OR LOWER(acs.nome) LIKE LOWER('%' || p_search_term || '%'))
        -- Filtro de status
        AND (
            p_status_filter = 'todos' OR
            (p_status_filter = 'alertas-ativos' AND acs.alertas_ativos > 0) OR
            (p_status_filter = 'com-retencoes' AND acs.total_retencoes > 0) OR
            (p_status_filter = 'criticos' AND acs.calculated_status = 'critico')
        )
    ORDER BY 
        -- Priorizar casos críticos, depois alertas ativos, depois por nome
        CASE acs.calculated_status
            WHEN 'critico' THEN 1
            WHEN 'alerta' THEN 2
            WHEN 'retencao' THEN 3
            ELSE 4
        END,
        acs.alertas_ativos DESC,
        acs.nome;
END;
$$;