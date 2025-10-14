-- Adicionar política RLS para permitir DELETE na tabela ah_recolhidas
CREATE POLICY "Acesso público para deletar recolhimentos"
ON public.ah_recolhidas
FOR DELETE
USING (true);