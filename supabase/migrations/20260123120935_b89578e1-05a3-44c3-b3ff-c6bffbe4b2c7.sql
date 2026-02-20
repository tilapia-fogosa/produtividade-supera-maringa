-- Adicionar novos valores ao enum status_alerta
ALTER TYPE status_alerta ADD VALUE IF NOT EXISTS 'retido';
ALTER TYPE status_alerta ADD VALUE IF NOT EXISTS 'evadido';