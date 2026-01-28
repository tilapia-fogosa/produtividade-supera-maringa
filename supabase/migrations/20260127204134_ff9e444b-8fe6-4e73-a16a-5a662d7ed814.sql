-- Adicionar campos de checklist para Dados Finais na tabela atividade_pos_venda
ALTER TABLE public.atividade_pos_venda
ADD COLUMN IF NOT EXISTS check_lancar_sgs boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS check_assinar_contrato boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS check_entregar_kit boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS check_cadastrar_pagamento boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS check_grupo_whatsapp boolean DEFAULT false;