-- Criar política de UPDATE para evento_participantes
CREATE POLICY "Usuários podem atualizar participantes"
ON evento_participantes
FOR UPDATE
USING (true);