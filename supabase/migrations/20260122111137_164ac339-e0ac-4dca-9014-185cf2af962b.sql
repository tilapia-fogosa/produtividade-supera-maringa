-- Adicionar campos de responsabilidade na tabela atividades_alerta_evasao
ALTER TABLE atividades_alerta_evasao
ADD COLUMN departamento_responsavel TEXT,
ADD COLUMN professor_responsavel_id UUID REFERENCES professores(id),
ADD COLUMN concluido_por_id UUID,
ADD COLUMN concluido_por_nome TEXT;

-- Comentários para documentação
COMMENT ON COLUMN atividades_alerta_evasao.departamento_responsavel IS 'Departamento responsável pela atividade (ex: administrativo)';
COMMENT ON COLUMN atividades_alerta_evasao.professor_responsavel_id IS 'Professor específico responsável pela atividade';
COMMENT ON COLUMN atividades_alerta_evasao.concluido_por_id IS 'ID do usuário que concluiu a atividade';
COMMENT ON COLUMN atividades_alerta_evasao.concluido_por_nome IS 'Nome do usuário que concluiu a atividade';