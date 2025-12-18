-- Alterar coluna id de uuid para text na tabela historico_whatsapp_grupos

-- 1. Remover a constraint de primary key existente
ALTER TABLE historico_whatsapp_grupos DROP CONSTRAINT IF EXISTS historico_whatsapp_grupos_pkey;

-- 2. Alterar o tipo da coluna id para text
ALTER TABLE historico_whatsapp_grupos ALTER COLUMN id TYPE text USING id::text;

-- 3. Remover o default de uuid
ALTER TABLE historico_whatsapp_grupos ALTER COLUMN id DROP DEFAULT;

-- 4. Recriar a primary key
ALTER TABLE historico_whatsapp_grupos ADD PRIMARY KEY (id);