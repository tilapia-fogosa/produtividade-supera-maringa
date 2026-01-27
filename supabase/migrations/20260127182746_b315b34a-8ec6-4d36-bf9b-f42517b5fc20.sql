-- Adicionar 'transferencia' ao enum payment_method
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'transferencia';