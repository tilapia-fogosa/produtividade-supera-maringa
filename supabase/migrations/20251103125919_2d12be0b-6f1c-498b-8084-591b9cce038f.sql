-- Habilitar RLS na tabela eventos_sala
ALTER TABLE public.eventos_sala ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Permitir leitura pública de eventos_sala"
ON public.eventos_sala
FOR SELECT
TO public
USING (true);

-- Política de inserção pública
CREATE POLICY "Permitir inserção pública de eventos_sala"
ON public.eventos_sala
FOR INSERT
TO public
WITH CHECK (true);

-- Política de atualização pública
CREATE POLICY "Permitir atualização pública de eventos_sala"
ON public.eventos_sala
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Política de exclusão pública
CREATE POLICY "Permitir exclusão pública de eventos_sala"
ON public.eventos_sala
FOR DELETE
TO public
USING (true);