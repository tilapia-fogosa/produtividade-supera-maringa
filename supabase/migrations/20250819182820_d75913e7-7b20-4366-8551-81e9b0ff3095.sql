-- Importar dados da coluna telefone para whatsapp_contato
-- Os dados da coluna telefone não serão alterados
UPDATE alunos 
SET whatapp_contato = telefone 
WHERE telefone IS NOT NULL 
  AND (whatapp_contato IS NULL OR whatapp_contato = '');