-- Adicionar novos valores ao enum tipo_atividade_evasao para suportar tarefas administrativas
ALTER TYPE tipo_atividade_evasao ADD VALUE IF NOT EXISTS 'remover_sgs';
ALTER TYPE tipo_atividade_evasao ADD VALUE IF NOT EXISTS 'cancelar_assinatura';
ALTER TYPE tipo_atividade_evasao ADD VALUE IF NOT EXISTS 'remover_whatsapp';
ALTER TYPE tipo_atividade_evasao ADD VALUE IF NOT EXISTS 'corrigir_valores_sgs';
ALTER TYPE tipo_atividade_evasao ADD VALUE IF NOT EXISTS 'corrigir_valores_assinatura';