-- Criar tabela de convidados não alunos para eventos
CREATE TABLE public.convidados_eventos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  telefone_contato TEXT NOT NULL,
  quem_convidou_tipo TEXT NOT NULL, -- 'funcionario' ou 'aluno'
  quem_convidou_id UUID NOT NULL,
  quem_convidou_nome TEXT NOT NULL,
  responsavel_cadastro_id UUID NOT NULL,
  responsavel_cadastro_tipo TEXT NOT NULL,
  responsavel_cadastro_nome TEXT NOT NULL,
  responsavel_id UUID NOT NULL, -- da view responsaveis
  responsavel_nome TEXT NOT NULL,
  valor_pago NUMERIC,
  forma_pagamento TEXT NOT NULL, -- 'cartao_credito', 'cartao_debito', 'boleto', 'pix', 'evento_gratuito'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.convidados_eventos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (seguindo o padrão das outras tabelas)
CREATE POLICY "Acesso público para visualizar convidados eventos"
ON public.convidados_eventos
FOR SELECT
USING (true);

CREATE POLICY "Acesso público para inserir convidados eventos"
ON public.convidados_eventos
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Acesso público para atualizar convidados eventos"
ON public.convidados_eventos
FOR UPDATE
USING (true);

CREATE POLICY "Acesso público para deletar convidados eventos"
ON public.convidados_eventos
FOR DELETE
USING (true);

-- Criar índices para melhor performance
CREATE INDEX idx_convidados_eventos_evento_id ON public.convidados_eventos(evento_id);
CREATE INDEX idx_convidados_eventos_active ON public.convidados_eventos(active);