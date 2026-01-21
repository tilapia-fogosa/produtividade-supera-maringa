-- Criar enum para tipos de atividade de evasão
CREATE TYPE public.tipo_atividade_evasao AS ENUM (
  'acolhimento',
  'atendimento_financeiro',
  'evasao',
  'atendimento_pedagogico',
  'retencao'
);

-- Criar tabela de atividades vinculadas aos alertas de evasão
CREATE TABLE public.atividades_alerta_evasao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alerta_evasao_id UUID NOT NULL REFERENCES public.alerta_evasao(id) ON DELETE CASCADE,
  tipo_atividade public.tipo_atividade_evasao NOT NULL,
  descricao TEXT NOT NULL,
  responsavel_id UUID REFERENCES auth.users(id),
  responsavel_nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índice para buscar atividades por alerta
CREATE INDEX idx_atividades_alerta_evasao_alerta_id ON public.atividades_alerta_evasao(alerta_evasao_id);

-- Habilitar RLS
ALTER TABLE public.atividades_alerta_evasao ENABLE ROW LEVEL SECURITY;

-- Política para visualizar atividades (todos autenticados podem ver)
CREATE POLICY "Usuários autenticados podem ver atividades de evasão"
ON public.atividades_alerta_evasao
FOR SELECT
TO authenticated
USING (true);

-- Política para inserir atividades (todos autenticados podem criar)
CREATE POLICY "Usuários autenticados podem criar atividades de evasão"
ON public.atividades_alerta_evasao
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para atualizar atividades (todos autenticados podem atualizar)
CREATE POLICY "Usuários autenticados podem atualizar atividades de evasão"
ON public.atividades_alerta_evasao
FOR UPDATE
TO authenticated
USING (true);

-- Política para deletar atividades (todos autenticados podem deletar)
CREATE POLICY "Usuários autenticados podem deletar atividades de evasão"
ON public.atividades_alerta_evasao
FOR DELETE
TO authenticated
USING (true);