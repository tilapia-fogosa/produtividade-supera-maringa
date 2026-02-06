-- Atualizar todos os registros de dezembro/2025 ou antes como Concluido
UPDATE atividade_pos_venda 
SET status_manual = 'Concluido' 
WHERE created_at < '2026-01-01';