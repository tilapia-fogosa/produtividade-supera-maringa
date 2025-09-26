-- Atualizar tabela camisetas para incluir informações detalhadas da entrega
ALTER TABLE public.camisetas 
ADD COLUMN tamanho_camiseta text,
ADD COLUMN responsavel_entrega_id uuid,
ADD COLUMN responsavel_entrega_tipo text CHECK (responsavel_entrega_tipo IN ('professor', 'funcionario')),
ADD COLUMN responsavel_entrega_nome text;