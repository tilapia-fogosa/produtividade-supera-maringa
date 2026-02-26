-- Drop the function if it already exists to ensure a clean update
DROP FUNCTION IF EXISTS get_unit_clients_with_next_activity(uuid);

-- Create the RPC function that bypasses RLS and returns the formatted data
CREATE OR REPLACE FUNCTION get_unit_clients_with_next_activity(p_unit_id uuid)
RETURNS TABLE (
    id uuid,
    name text,
    phone_number text,
    lead_source text,
    status text,
    created_at timestamptz,
    next_activity_date timestamptz,
    next_activity_type text,
    original_ad text,
    created_by_name text
)
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass Row Level Security policies of the running user
AS $$
BEGIN
    RETURN QUERY
    WITH future_activities AS (
        -- Get all future activities for clients of this unit, ordered by date
        SELECT 
            ca.client_id,
            ca.tipo_atividade,
            ca.next_contact_date,
            ROW_NUMBER() OVER(PARTITION BY ca.client_id ORDER BY ca.next_contact_date ASC) as rn
        FROM client_activities ca
        WHERE ca.unit_id = p_unit_id 
        AND ca.next_contact_date > NOW()
    )
    SELECT 
        c.id,
        c.name,
        c.phone_number,
        c.lead_source,
        c.status,
        c.created_at,
        fa.next_contact_date as next_activity_date,
        fa.tipo_atividade as next_activity_type,
        c.original_ad,
        p.full_name as created_by_name
    FROM clients c
    LEFT JOIN future_activities fa ON c.id = fa.client_id AND fa.rn = 1
    LEFT JOIN profiles p ON c.created_by = p.id
    WHERE c.unit_id = p_unit_id
    ORDER BY c.created_at DESC;
END;
$$;
