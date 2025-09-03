-- Adicionar novas funcionalidades ao enum tipo_funcionalidade
ALTER TYPE tipo_funcionalidade ADD VALUE IF NOT EXISTS 'disparo_slack';
ALTER TYPE tipo_funcionalidade ADD VALUE IF NOT EXISTS 'gestao_estoque'; 
ALTER TYPE tipo_funcionalidade ADD VALUE IF NOT EXISTS 'gestao_eventos';