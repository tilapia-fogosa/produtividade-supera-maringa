-- Converter registros existentes com status 'resolvido' para 'retido' (retenções anteriores)
UPDATE alerta_evasao 
SET status = 'retido' 
WHERE status = 'resolvido';