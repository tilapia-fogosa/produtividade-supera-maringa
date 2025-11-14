-- Atualizar todos os alunos ativos que não têm ultima_correcao_ah definida
-- Define a data atual para facilitar o controle de coletas AH
UPDATE alunos
SET ultima_correcao_ah = NOW()
WHERE active = true 
  AND ultima_correcao_ah IS NULL;