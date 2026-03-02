-- Adiciona coluna de horário de funcionamento na tabela units
-- Formato JSONB com um registro por dia da semana
-- Exemplo: { "segunda": { "aberto": true, "inicio": "08:00", "fim": "18:00" }, ... }
ALTER TABLE units ADD COLUMN IF NOT EXISTS horario_funcionamento jsonb DEFAULT NULL;
