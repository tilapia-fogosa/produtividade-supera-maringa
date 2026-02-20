-- Inserir itens de camisetas no estoque
-- Camisetas Adulto
INSERT INTO estoque (nome, tipo_item, quantidade, unit_id) VALUES 
('Adulto: PP', 'camiseta', 0, (SELECT id FROM units LIMIT 1)),
('Adulto: P', 'camiseta', 0, (SELECT id FROM units LIMIT 1)),
('Adulto: M', 'camiseta', 0, (SELECT id FROM units LIMIT 1)),
('Adulto: G', 'camiseta', 0, (SELECT id FROM units LIMIT 1)),
('Adulto: GG', 'camiseta', 0, (SELECT id FROM units LIMIT 1)),
('Adulto: EXG', 'camiseta', 0, (SELECT id FROM units LIMIT 1)),

-- Camisetas Infantil
('Infantil: nº 4', 'camiseta', 0, (SELECT id FROM units LIMIT 1)),
('Infantil: nº 6', 'camiseta', 0, (SELECT id FROM units LIMIT 1)),
('Infantil: nº 8', 'camiseta', 0, (SELECT id FROM units LIMIT 1)),
('Infantil: nº 10', 'camiseta', 0, (SELECT id FROM units LIMIT 1)),
('Infantil: nº 12', 'camiseta', 0, (SELECT id FROM units LIMIT 1)),
('Infantil: nº 14', 'camiseta', 0, (SELECT id FROM units LIMIT 1)),

-- Baby Look
('Baby Look: P', 'camiseta', 0, (SELECT id FROM units LIMIT 1)),
('Baby Look: M', 'camiseta', 0, (SELECT id FROM units LIMIT 1));