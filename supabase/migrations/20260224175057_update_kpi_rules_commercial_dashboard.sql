CREATE OR REPLACE FUNCTION get_commercial_funnel(p_unit_ids uuid[], p_start_date timestamptz, p_end_date timestamptz)
RETURNS TABLE (
    stage text,
    client_count bigint,
    step_order integer
) AS $$
BEGIN
    RETURN QUERY
    -- 1. Leads
    SELECT 'Tentativas de Contato'::text, COUNT(DISTINCT client_id)::bigint, 1 as step_order
    FROM client_activities
    WHERE unit_id = ANY(p_unit_ids)
    AND tipo_atividade = 'Tentativa de Contato'
    AND created_at >= p_start_date AND created_at <= p_end_date
    
    UNION ALL
    
    -- 2. Contatos Efetivos (AGORA INCLUI AGENDAMENTO)
    SELECT 'Contatos Efetivos'::text, COUNT(DISTINCT client_id)::bigint, 2 as step_order
    FROM client_activities
    WHERE unit_id = ANY(p_unit_ids)
    AND tipo_atividade IN ('Contato Efetivo', 'Agendamento')
    AND created_at >= p_start_date AND created_at <= p_end_date

    UNION ALL
    
    -- 3. Agendamentos
    SELECT 'Agendamentos'::text, COUNT(DISTINCT client_id)::bigint, 3 as step_order
    FROM client_activities
    WHERE unit_id = ANY(p_unit_ids)
    AND tipo_atividade = 'Agendamento'
    AND created_at >= p_start_date AND created_at <= p_end_date

    UNION ALL
    
    -- 4. Atendimentos
    SELECT 'Atendimentos'::text, COUNT(DISTINCT client_id)::bigint, 4 as step_order
    FROM client_activities
    WHERE unit_id = ANY(p_unit_ids)
    AND tipo_atividade = 'Atendimento'
    AND created_at >= p_start_date AND created_at <= p_end_date

    UNION ALL
    
    -- 5. Matrículas
    SELECT 'Matrículas'::text, COUNT(*)::bigint, 5 as step_order
    FROM atividade_pos_venda
    WHERE unit_id = ANY(p_unit_ids)
    AND created_at >= p_start_date AND created_at <= p_end_date
    
    ORDER BY step_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION get_sdr_performance(p_unit_ids uuid[], p_start_date timestamptz, p_end_date timestamptz)
RETURNS TABLE (
    user_name text,
    new_clients bigint,
    total_contacts bigint,
    effective_contacts bigint,
    scheduled_visits bigint,
    awaiting_visits bigint,
    completed_visits bigint,
    enrollments bigint
) AS $$
BEGIN
    RETURN QUERY
    WITH sdr_users AS (
        SELECT DISTINCT created_by as user_id FROM client_activities WHERE unit_id = ANY(p_unit_ids) AND created_at >= p_start_date AND created_at <= p_end_date
        UNION
        SELECT DISTINCT created_by as user_id FROM clients WHERE unit_id = ANY(p_unit_ids) AND created_at >= p_start_date AND created_at <= p_end_date
    ),
    metrics AS (
        SELECT 
            u.user_id,
            (SELECT COUNT(*) FROM clients c WHERE c.created_by = u.user_id AND c.unit_id = ANY(p_unit_ids) AND c.created_at >= p_start_date AND c.created_at <= p_end_date) as new_clients,
            (SELECT COUNT(*) FROM client_activities ca WHERE ca.created_by = u.user_id AND ca.tipo_atividade IN ('Tentativa de Contato', 'Contato Efetivo', 'Agendamento') AND ca.unit_id = ANY(p_unit_ids) AND ca.created_at >= p_start_date AND ca.created_at <= p_end_date) as total_contacts,
            
            -- AGORA INCLUI AGENDAMENTO
            (SELECT COUNT(*) FROM client_activities ca WHERE ca.created_by = u.user_id AND ca.tipo_atividade IN ('Contato Efetivo', 'Agendamento') AND ca.unit_id = ANY(p_unit_ids) AND ca.created_at >= p_start_date AND ca.created_at <= p_end_date) as effective_contacts,
            
            (SELECT COUNT(*) FROM client_activities ca WHERE ca.created_by = u.user_id AND ca.tipo_atividade = 'Agendamento' AND ca.unit_id = ANY(p_unit_ids) AND ca.created_at >= p_start_date AND ca.created_at <= p_end_date) as scheduled_visits,
            
            -- AGORA CONTA VISITAS QUE FORAM MARCADAS *PARA CAIR* NESTE PERÍODO, INDEPENDENTE SE JÁ PASSOU OU NÃO DA DATA ATUAL
            (SELECT COUNT(*) FROM client_activities ca WHERE ca.created_by = u.user_id AND ca.tipo_atividade = 'Agendamento' AND ca.scheduled_date >= p_start_date AND ca.scheduled_date <= p_end_date AND ca.unit_id = ANY(p_unit_ids) AND ca.created_at >= p_start_date AND ca.created_at <= p_end_date) as awaiting_visits,
            
            -- Completed visits triggered by this SDR (The SDR scheduled it, and an Atendimento occurred in the period)
            (SELECT COUNT(DISTINCT ca_atend.client_id) 
             FROM client_activities ca_atend 
             JOIN client_activities ca_sched ON ca_atend.client_id = ca_sched.client_id 
             WHERE ca_atend.tipo_atividade = 'Atendimento' 
             AND ca_sched.tipo_atividade = 'Agendamento' 
             AND ca_sched.created_by = u.user_id
             AND ca_atend.unit_id = ANY(p_unit_ids) 
             AND ca_atend.created_at >= p_start_date AND ca_atend.created_at <= p_end_date) as completed_visits,
             
            -- Enrollments triggered by this SDR 
            (SELECT COUNT(DISTINCT apv.id) 
             FROM atividade_pos_venda apv
             JOIN client_activities ca_sched ON apv.client_id = ca_sched.client_id 
             WHERE ca_sched.tipo_atividade = 'Agendamento' 
             AND ca_sched.created_by = u.user_id
             AND apv.unit_id = ANY(p_unit_ids) 
             AND apv.created_at >= p_start_date AND apv.created_at <= p_end_date) as enrollments
        FROM sdr_users u
    )
    SELECT 
        COALESCE((SELECT full_name FROM profiles WHERE profiles.id = metrics.user_id), 'Usuário Desconhecido') as user_name,
        metrics.new_clients,
        metrics.total_contacts,
        metrics.effective_contacts,
        metrics.scheduled_visits,
        metrics.awaiting_visits,
        metrics.completed_visits,
        metrics.enrollments
    FROM metrics
    WHERE metrics.new_clients > 0 OR metrics.total_contacts > 0 OR metrics.enrollments > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION get_origin_performance(p_unit_ids uuid[], p_start_date timestamptz, p_end_date timestamptz)
RETURNS TABLE (
    source_name text,
    new_clients bigint,
    total_contacts bigint,
    effective_contacts bigint,
    scheduled_visits bigint,
    awaiting_visits bigint,
    completed_visits bigint,
    enrollments bigint
) AS $$
BEGIN
    RETURN QUERY
    WITH sources AS (
        SELECT DISTINCT lead_source as source_name FROM clients WHERE unit_id = ANY(p_unit_ids) AND created_at >= p_start_date AND created_at <= p_end_date
    ),
    metrics AS (
        SELECT 
            s.source_name,
            (SELECT COUNT(*) FROM clients c WHERE COALESCE(c.lead_source, 'Outros') = COALESCE(s.source_name, 'Outros') AND c.unit_id = ANY(p_unit_ids) AND c.created_at >= p_start_date AND c.created_at <= p_end_date) as new_clients,
            
            (SELECT COUNT(*) FROM client_activities ca JOIN clients c ON ca.client_id = c.id WHERE COALESCE(c.lead_source, 'Outros') = COALESCE(s.source_name, 'Outros') AND ca.tipo_atividade IN ('Tentativa de Contato', 'Contato Efetivo', 'Agendamento') AND ca.unit_id = ANY(p_unit_ids) AND ca.created_at >= p_start_date AND ca.created_at <= p_end_date) as total_contacts,
            
            -- AGORA INCLUI AGENDAMENTO
            (SELECT COUNT(*) FROM client_activities ca JOIN clients c ON ca.client_id = c.id WHERE COALESCE(c.lead_source, 'Outros') = COALESCE(s.source_name, 'Outros') AND ca.tipo_atividade IN ('Contato Efetivo', 'Agendamento') AND ca.unit_id = ANY(p_unit_ids) AND ca.created_at >= p_start_date AND ca.created_at <= p_end_date) as effective_contacts,
            
            (SELECT COUNT(*) FROM client_activities ca JOIN clients c ON ca.client_id = c.id WHERE COALESCE(c.lead_source, 'Outros') = COALESCE(s.source_name, 'Outros') AND ca.tipo_atividade = 'Agendamento' AND ca.unit_id = ANY(p_unit_ids) AND ca.created_at >= p_start_date AND ca.created_at <= p_end_date) as scheduled_visits,
            
            -- AGORA CONTA VISITAS QUE FORAM MARCADAS *PARA CAIR* NESTE PERÍODO
            (SELECT COUNT(*) FROM client_activities ca JOIN clients c ON ca.client_id = c.id WHERE COALESCE(c.lead_source, 'Outros') = COALESCE(s.source_name, 'Outros') AND ca.tipo_atividade = 'Agendamento' AND ca.scheduled_date >= p_start_date AND ca.scheduled_date <= p_end_date AND ca.unit_id = ANY(p_unit_ids) AND ca.created_at >= p_start_date AND ca.created_at <= p_end_date) as awaiting_visits,
            
            (SELECT COUNT(DISTINCT ca.client_id) FROM client_activities ca JOIN clients c ON ca.client_id = c.id WHERE COALESCE(c.lead_source, 'Outros') = COALESCE(s.source_name, 'Outros') AND ca.tipo_atividade = 'Atendimento' AND ca.unit_id = ANY(p_unit_ids) AND ca.created_at >= p_start_date AND ca.created_at <= p_end_date) as completed_visits,
             
            (SELECT COUNT(DISTINCT apv.id) FROM atividade_pos_venda apv JOIN clients c ON apv.client_id = c.id WHERE COALESCE(c.lead_source, 'Outros') = COALESCE(s.source_name, 'Outros') AND apv.unit_id = ANY(p_unit_ids) AND apv.created_at >= p_start_date AND apv.created_at <= p_end_date) as enrollments
        FROM sources s
    )
    SELECT 
        COALESCE(metrics.source_name, 'Indefinido') as source_name,
        metrics.new_clients,
        metrics.total_contacts,
        metrics.effective_contacts,
        metrics.scheduled_visits,
        metrics.awaiting_visits,
        metrics.completed_visits,
        metrics.enrollments
    FROM metrics
    WHERE metrics.new_clients > 0 OR metrics.total_contacts > 0 OR metrics.enrollments > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION get_unit_performance(p_unit_ids uuid[], p_start_date timestamptz, p_end_date timestamptz)
RETURNS TABLE (
    unit_name text,
    new_clients bigint,
    total_contacts bigint,
    effective_contacts bigint,
    scheduled_visits bigint,
    awaiting_visits bigint,
    completed_visits bigint,
    enrollments bigint
) AS $$
BEGIN
    RETURN QUERY
    WITH units AS (
        SELECT id, name FROM units WHERE id = ANY(p_unit_ids)
    ),
    metrics AS (
        SELECT 
            u.id,
            u.name,
            (SELECT COUNT(*) FROM clients c WHERE c.unit_id = u.id AND c.created_at >= p_start_date AND c.created_at <= p_end_date) as new_clients,
            
            (SELECT COUNT(*) FROM client_activities ca WHERE ca.unit_id = u.id AND ca.tipo_atividade IN ('Tentativa de Contato', 'Contato Efetivo', 'Agendamento') AND ca.created_at >= p_start_date AND ca.created_at <= p_end_date) as total_contacts,
            
            -- AGORA INCLUI AGENDAMENTO
            (SELECT COUNT(*) FROM client_activities ca WHERE ca.unit_id = u.id AND ca.tipo_atividade IN ('Contato Efetivo', 'Agendamento') AND ca.created_at >= p_start_date AND ca.created_at <= p_end_date) as effective_contacts,
            
            (SELECT COUNT(*) FROM client_activities ca WHERE ca.unit_id = u.id AND ca.tipo_atividade = 'Agendamento' AND ca.created_at >= p_start_date AND ca.created_at <= p_end_date) as scheduled_visits,
            
            -- AGORA CONTA VISITAS QUE FORAM MARCADAS *PARA CAIR* NESTE PERÍODO
            (SELECT COUNT(*) FROM client_activities ca WHERE ca.unit_id = u.id AND ca.tipo_atividade = 'Agendamento' AND ca.scheduled_date >= p_start_date AND ca.scheduled_date <= p_end_date AND ca.created_at >= p_start_date AND ca.created_at <= p_end_date) as awaiting_visits,
            
            (SELECT COUNT(DISTINCT ca.client_id) FROM client_activities ca WHERE ca.unit_id = u.id AND ca.tipo_atividade = 'Atendimento' AND ca.created_at >= p_start_date AND ca.created_at <= p_end_date) as completed_visits,
             
            (SELECT COUNT(DISTINCT apv.id) FROM atividade_pos_venda apv WHERE apv.unit_id = u.id AND apv.created_at >= p_start_date AND apv.created_at <= p_end_date) as enrollments
        FROM units u
    )
    SELECT 
        metrics.name as unit_name,
        metrics.new_clients,
        metrics.total_contacts,
        metrics.effective_contacts,
        metrics.scheduled_visits,
        metrics.awaiting_visits,
        metrics.completed_visits,
        metrics.enrollments
    FROM metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
