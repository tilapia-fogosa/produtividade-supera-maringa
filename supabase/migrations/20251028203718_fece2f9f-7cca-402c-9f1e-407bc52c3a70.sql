-- Atualizar as 3 salas para a unidade de Maringá
UPDATE salas
SET unit_id = '0df79a04-444e-46ee-b218-59e4b1835f4a'
WHERE nome IN ('axonio', 'neuronio', 'dendrito');