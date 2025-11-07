-- Habilitar Row Level Security na tabela alertas_falta
ALTER TABLE alertas_falta ENABLE ROW LEVEL SECURITY;

-- Política para visualizar alertas de falta (público para autenticados)
CREATE POLICY "Usuários autenticados podem visualizar alertas de falta"
ON alertas_falta
FOR SELECT
USING (true);

-- Política para inserir alertas de falta (público para autenticados)
CREATE POLICY "Usuários autenticados podem inserir alertas de falta"
ON alertas_falta
FOR INSERT
WITH CHECK (true);

-- Política para atualizar alertas de falta (público para autenticados)
CREATE POLICY "Usuários autenticados podem atualizar alertas de falta"
ON alertas_falta
FOR UPDATE
USING (true);