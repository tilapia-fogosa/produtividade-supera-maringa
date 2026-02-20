-- Adicionar coluna responsavel_entrega_tipo se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'camisetas' 
                 AND column_name = 'responsavel_entrega_tipo') THEN
    ALTER TABLE public.camisetas ADD COLUMN responsavel_entrega_tipo TEXT;
  END IF;
END $$;

-- Remover view existente se existir e criar nova view
DROP VIEW IF EXISTS public.responsaveis_view;

CREATE VIEW public.responsaveis_view AS
SELECT 
  p.id,
  p.nome,
  'professor'::text as tipo
FROM professores p 
WHERE p.status = true

UNION ALL

SELECT 
  f.id,
  f.nome,
  'funcionario'::text as tipo
FROM funcionarios f 
WHERE f.active = true 
  AND f.cargo NOT ILIKE '%filha%' 
  AND f.cargo NOT ILIKE '%familiar%';

-- Comentários para documentação
COMMENT ON VIEW public.responsaveis_view IS 'View unificada que combina professores e funcionários ativos para seleção de responsáveis';