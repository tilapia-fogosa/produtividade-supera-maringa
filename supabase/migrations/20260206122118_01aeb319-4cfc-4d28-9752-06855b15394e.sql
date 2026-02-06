-- Adicionar coluna status_manual para permitir forçar status de conclusão
ALTER TABLE atividade_pos_venda 
ADD COLUMN status_manual TEXT;

-- Comentário para documentação
COMMENT ON COLUMN atividade_pos_venda.status_manual IS 'Status manual que sobrescreve o cálculo dinâmico. Valores: Concluido ou NULL';