
-- ==============================================
-- FASE 9: Migrar Alertas de Evasão para Multi-Unidades
-- ==============================================

-- =====================
-- ETAPA 1: Adicionar unit_id às 3 tabelas
-- =====================

-- 1a. alerta_evasao
ALTER TABLE public.alerta_evasao 
ADD COLUMN unit_id uuid REFERENCES public.units(id);

-- 1b. atividades_alerta_evasao
ALTER TABLE public.atividades_alerta_evasao 
ADD COLUMN unit_id uuid REFERENCES public.units(id);

-- 1c. kanban_cards
ALTER TABLE public.kanban_cards 
ADD COLUMN unit_id uuid REFERENCES public.units(id);

-- =====================
-- ETAPA 1.2: Backfill dados existentes
-- =====================

-- alerta_evasao: herda de alunos.unit_id
UPDATE alerta_evasao ae
SET unit_id = a.unit_id
FROM alunos a
WHERE ae.aluno_id = a.id
AND ae.unit_id IS NULL;

-- Fallback Maringá para órfãos
UPDATE alerta_evasao
SET unit_id = '0df79a04-444e-46ee-b218-59e4b1835f4a'
WHERE unit_id IS NULL;

-- atividades_alerta_evasao: herda de alerta_evasao.unit_id
UPDATE atividades_alerta_evasao aae
SET unit_id = ae.unit_id
FROM alerta_evasao ae
WHERE aae.alerta_evasao_id = ae.id
AND aae.unit_id IS NULL;

-- Fallback Maringá para órfãos
UPDATE atividades_alerta_evasao
SET unit_id = '0df79a04-444e-46ee-b218-59e4b1835f4a'
WHERE unit_id IS NULL;

-- kanban_cards: herda de alerta_evasao.unit_id (via alerta_evasao_id)
UPDATE kanban_cards kc
SET unit_id = ae.unit_id
FROM alerta_evasao ae
WHERE kc.alerta_evasao_id = ae.id
AND kc.unit_id IS NULL;

-- Fallback Maringá para órfãos (kanban_cards sem alerta_evasao_id)
UPDATE kanban_cards
SET unit_id = '0df79a04-444e-46ee-b218-59e4b1835f4a'
WHERE unit_id IS NULL;

-- =====================
-- ETAPA 1.3: Tornar NOT NULL
-- =====================

ALTER TABLE public.alerta_evasao ALTER COLUMN unit_id SET NOT NULL;
ALTER TABLE public.atividades_alerta_evasao ALTER COLUMN unit_id SET NOT NULL;
ALTER TABLE public.kanban_cards ALTER COLUMN unit_id SET NOT NULL;

-- =====================
-- ETAPA 1.4: Criar índices
-- =====================

CREATE INDEX idx_alerta_evasao_unit_id ON public.alerta_evasao(unit_id);
CREATE INDEX idx_atividades_alerta_evasao_unit_id ON public.atividades_alerta_evasao(unit_id);
CREATE INDEX idx_kanban_cards_unit_id ON public.kanban_cards(unit_id);

-- =====================
-- ETAPA 2: Atualizar Trigger Automática
-- =====================

CREATE OR REPLACE FUNCTION public.criar_atividade_acolhimento_automatica()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_professor_id UUID;
  v_professor_nome TEXT;
  v_descricao TEXT;
  v_data_hoje DATE;
BEGIN
  -- Buscar o professor da turma do aluno
  SELECT p.id, p.nome INTO v_professor_id, v_professor_nome
  FROM alunos a
  LEFT JOIN turmas t ON a.turma_id = t.id
  LEFT JOIN professores p ON t.professor_id = p.id
  WHERE a.id = NEW.aluno_id;

  -- Usar o descritivo do alerta ou um texto padrão
  v_descricao := COALESCE(NEW.descritivo, 'Atividade de acolhimento criada automaticamente');
  
  -- Data de hoje para data_agendada
  v_data_hoje := CURRENT_DATE;

  -- Inserir a atividade de acolhimento COM o professor_responsavel_id e unit_id
  INSERT INTO public.atividades_alerta_evasao (
    alerta_evasao_id,
    tipo_atividade,
    descricao,
    responsavel_id,
    responsavel_nome,
    professor_responsavel_id,
    data_agendada,
    status,
    unit_id
  ) VALUES (
    NEW.id,
    'acolhimento',
    v_descricao,
    NULL,
    COALESCE(v_professor_nome, 'Sistema'),
    v_professor_id,
    v_data_hoje,
    'pendente',
    NEW.unit_id
  );

  RETURN NEW;
END;
$function$;

-- =====================
-- ETAPA 3: Atualizar RPCs
-- =====================

-- 3a. get_alunos_retencoes_historico com p_unit_id
CREATE OR REPLACE FUNCTION public.get_alunos_retencoes_historico(
  p_search_term text DEFAULT ''::text, 
  p_status_filter text DEFAULT 'todos'::text, 
  p_incluir_ocultos boolean DEFAULT false,
  p_unit_id uuid DEFAULT NULL
)
 RETURNS TABLE(id uuid, nome text, turma text, educador text, total_alertas bigint, alertas_ativos bigint, total_retencoes bigint, ultimo_alerta timestamp with time zone, ultima_retencao timestamp with time zone, status text, oculto_retencoes boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    WITH alunos_dados AS (
        SELECT 
            a.id,
            a.nome,
            COALESCE(t.nome, 'Sem turma') as turma_nome,
            COALESCE(p.nome, 'Sem professor') as professor_nome,
            a.oculto_retencoes,
            COALESCE(alertas_count.total_alertas, 0) as total_alertas,
            COALESCE(alertas_count.alertas_ativos, 0) as alertas_ativos,
            COALESCE(retencoes_count.total_retencoes, 0) as total_retencoes,
            alertas_recentes.ultimo_alerta,
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
            WHERE (p_unit_id IS NULL OR ae.unit_id = p_unit_id)
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
            WHERE (p_unit_id IS NULL OR ae2.unit_id = p_unit_id)
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
        AND (p_unit_id IS NULL OR a.unit_id = p_unit_id)
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
        WHERE (ad.total_alertas > 0 OR ad.total_retencoes > 0)
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
        (p_search_term = '' OR LOWER(acs.nome) LIKE LOWER('%' || p_search_term || '%'))
        AND (
            p_status_filter = 'todos' OR
            (p_status_filter = 'alertas-ativos' AND acs.alertas_ativos > 0) OR
            (p_status_filter = 'com-retencoes' AND acs.total_retencoes > 0) OR
            (p_status_filter = 'criticos' AND acs.calculated_status = 'critico')
        )
    ORDER BY 
        CASE acs.calculated_status
            WHEN 'critico' THEN 1
            WHEN 'alerta' THEN 2
            WHEN 'retencao' THEN 3
            ELSE 4
        END,
        acs.alertas_ativos DESC,
        acs.nome;
END;
$function$;

-- 3b. get_aluno_detalhes com p_unit_id
CREATE OR REPLACE FUNCTION public.get_aluno_detalhes(p_aluno_nome text, p_unit_id uuid DEFAULT NULL)
 RETURNS TABLE(aluno_id uuid, turma text, educador text, faltas_recorrentes boolean)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    a.id AS aluno_id,
    t.nome AS turma,
    p.nome AS educador,
    (SELECT COUNT(*) >= 3 FROM produtividade_abaco pa 
     WHERE pa.aluno_id = a.id 
     AND pa.presente = false 
     AND pa.data_aula >= CURRENT_DATE - INTERVAL '30 days') AS faltas_recorrentes
  FROM alunos a
  LEFT JOIN turmas t ON a.turma_id = t.id
  LEFT JOIN professores p ON t.professor_id = p.id
  WHERE a.nome = p_aluno_nome
  AND (p_unit_id IS NULL OR a.unit_id = p_unit_id);
  
  RETURN;
END;
$function$;
