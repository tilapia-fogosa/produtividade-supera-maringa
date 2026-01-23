-- Adicionar coluna data_agendada para atividades que devem ser executadas em uma data futura
ALTER TABLE atividades_alerta_evasao
ADD COLUMN data_agendada DATE;