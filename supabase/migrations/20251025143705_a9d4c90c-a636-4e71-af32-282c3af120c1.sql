-- Criar view que combina professores ativos e funcionários (exceto familiares)
CREATE OR REPLACE VIEW responsaveis_view AS
SELECT 
  p.id,
  p.nome,
  'professor'::text as tipo,
  p.unit_id,
  p.created_at
FROM professores p
WHERE p.status = true

UNION ALL

SELECT 
  f.id,
  f.nome,
  'funcionario'::text as tipo,
  f.unit_id,
  f.created_at
FROM funcionarios f
WHERE f.active = true
  AND (f.cargo IS NULL OR LOWER(f.cargo) NOT LIKE '%familiar%')

ORDER BY nome ASC;