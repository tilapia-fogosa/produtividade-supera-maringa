-- Criar tabela de eventos
CREATE TABLE public.eventos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  descricao text,
  data_evento timestamp with time zone NOT NULL,
  local text,
  responsavel text,
  tipo text NOT NULL DEFAULT 'Evento',
  numero_vagas integer NOT NULL DEFAULT 0,
  unit_id uuid NOT NULL,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true
);

-- Criar tabela de participantes dos eventos
CREATE TABLE public.evento_participantes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id uuid NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  forma_pagamento text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(evento_id, aluno_id)
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento_participantes ENABLE ROW LEVEL SECURITY;

-- Políticas para eventos
CREATE POLICY "Usuários podem visualizar eventos" 
ON public.eventos 
FOR SELECT 
USING (true);

CREATE POLICY "Usuários podem criar eventos" 
ON public.eventos 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar eventos" 
ON public.eventos 
FOR UPDATE 
USING (true);

CREATE POLICY "Usuários podem deletar eventos" 
ON public.eventos 
FOR DELETE 
USING (true);

-- Políticas para participantes
CREATE POLICY "Usuários podem visualizar participantes" 
ON public.evento_participantes 
FOR SELECT 
USING (true);

CREATE POLICY "Usuários podem adicionar participantes" 
ON public.evento_participantes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Usuários podem remover participantes" 
ON public.evento_participantes 
FOR DELETE 
USING (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_eventos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_eventos_updated_at
BEFORE UPDATE ON public.eventos
FOR EACH ROW
EXECUTE FUNCTION public.update_eventos_updated_at();