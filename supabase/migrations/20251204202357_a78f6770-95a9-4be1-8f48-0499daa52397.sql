-- Tabela para registro de ponto de funcionários
CREATE TABLE public.registro_ponto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_usuario UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tipo_registro TEXT NOT NULL CHECK (tipo_registro IN ('entrada', 'saida'))
);

-- Habilitar RLS
ALTER TABLE public.registro_ponto ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver apenas seus próprios registros
CREATE POLICY "Usuários podem ver seus próprios registros"
ON public.registro_ponto
FOR SELECT
USING (auth.uid() = id_usuario);

-- Política: usuários podem inserir seus próprios registros
CREATE POLICY "Usuários podem inserir seus próprios registros"
ON public.registro_ponto
FOR INSERT
WITH CHECK (auth.uid() = id_usuario);

-- Índice para melhorar performance de consultas por usuário
CREATE INDEX idx_registro_ponto_usuario ON public.registro_ponto(id_usuario);

-- Índice para consultas por data
CREATE INDEX idx_registro_ponto_created_at ON public.registro_ponto(created_at DESC);