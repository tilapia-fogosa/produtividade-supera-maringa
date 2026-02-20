-- Criar função RPC para resultados mensais de retenção
CREATE OR REPLACE FUNCTION public.get_resultados_mensais_retencao()
RETURNS TABLE (
    aluno_id UUID,
    aluno_nome TEXT,
    turma_nome TEXT,
    professor_nome TEXT,
    aluno_ativo BOOLEAN,
    primeiro_alerta TIMESTAMP WITH TIME ZONE,
    primeira_retencao TIMESTAMP WITH TIME ZONE,
    dias_desde_primeiro_alerta INTEGER,
    dias_desde_primeira_retencao INTEGER,
    total_alertas BIGINT,
    total_retencoes BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH alunos_com_dados AS (
        SELECT 
            a.id as aluno_id,
            a.nome as aluno_nome,
            COALESCE(t.nome, 'Sem turma') as turma_nome,
            COALESCE(p.nome, 'Sem professor') as professor_nome,
            a.active as aluno_ativo,
            -- Primeiro alerta de evasão
            primeiro_alerta.data_primeiro_alerta,
            -- Primeira retenção
            primeira_retencao.data_primeira_retencao,
            -- Contar alertas
            COALESCE(alertas_count.total_alertas, 0) as total_alertas,
            -- Contar retenções
            COALESCE(retencoes_count.total_retencoes, 0) as total_retencoes
        FROM alunos a
        LEFT JOIN turmas t ON a.turma_id = t.id
        LEFT JOIN professores p ON t.professor_id = p.id
        LEFT JOIN (
            -- Primeiro alerta por aluno
            SELECT DISTINCT ON (ae.aluno_id)
                ae.aluno_id,
                ae.created_at as data_primeiro_alerta
            FROM alerta_evasao ae
            ORDER BY ae.aluno_id, ae.created_at ASC
        ) primeiro_alerta ON a.id = primeiro_alerta.aluno_id
        LEFT JOIN (
            -- Primeira retenção por aluno
            SELECT DISTINCT ON (r.aluno_id)
                r.aluno_id,
                r.created_at as data_primeira_retencao
            FROM retencoes r
            ORDER BY r.aluno_id, r.created_at ASC
        ) primeira_retencao ON a.id = primeira_retencao.aluno_id
        LEFT JOIN (
            SELECT 
                ae2.aluno_id,
                COUNT(*) as total_alertas
            FROM alerta_evasao ae2
            GROUP BY ae2.aluno_id
        ) alertas_count ON a.id = alertas_count.aluno_id
        LEFT JOIN (
            SELECT 
                r2.aluno_id,
                COUNT(*) as total_retencoes
            FROM retencoes r2
            GROUP BY r2.aluno_id
        ) retencoes_count ON a.id = retencoes_count.aluno_id
        -- Incluir apenas alunos que tiveram pelo menos um alerta ou retenção
        WHERE (primeiro_alerta.data_primeiro_alerta IS NOT NULL OR primeira_retencao.data_primeira_retencao IS NOT NULL)
    )
    SELECT 
        acd.aluno_id,
        acd.aluno_nome,
        acd.turma_nome,
        acd.professor_nome,
        acd.aluno_ativo,
        acd.data_primeiro_alerta as primeiro_alerta,
        acd.data_primeira_retencao as primeira_retencao,
        -- Calcular dias desde primeiro alerta
        CASE 
            WHEN acd.data_primeiro_alerta IS NOT NULL 
            THEN EXTRACT(DAY FROM (NOW() - acd.data_primeiro_alerta))::INTEGER
            ELSE NULL 
        END as dias_desde_primeiro_alerta,
        -- Calcular dias desde primeira retenção
        CASE 
            WHEN acd.data_primeira_retencao IS NOT NULL 
            THEN EXTRACT(DAY FROM (NOW() - acd.data_primeira_retencao))::INTEGER
            ELSE NULL 
        END as dias_desde_primeira_retencao,
        acd.total_alertas,
        acd.total_retencoes
    FROM alunos_com_dados acd
    ORDER BY 
        acd.aluno_ativo DESC, -- Alunos ativos primeiro
        COALESCE(acd.data_primeiro_alerta, acd.data_primeira_retencao) DESC; -- Mais recentes primeiro
END;
$$;