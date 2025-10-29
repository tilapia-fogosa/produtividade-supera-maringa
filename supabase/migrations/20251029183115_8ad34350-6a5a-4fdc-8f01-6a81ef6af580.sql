-- Remover a política antiga de INSERT que está bloqueando
DROP POLICY IF EXISTS "Apenas autenticados podem criar eventos professor" ON public.eventos_professor;

-- Criar nova política mais permissiva para INSERT
CREATE POLICY "Usuários autenticados podem criar eventos"
ON public.eventos_professor
FOR INSERT
TO authenticated
WITH CHECK (true);