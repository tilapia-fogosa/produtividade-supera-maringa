-- Alterar coluna id de int8 para uuid na tabela historico_whatsapp_grupos

-- 1. Remover a constraint de primary key existente
ALTER TABLE historico_whatsapp_grupos DROP CONSTRAINT IF EXISTS historico_whatsapp_grupos_pkey;

-- 2. Adicionar coluna temporária uuid
ALTER TABLE historico_whatsapp_grupos ADD COLUMN id_new uuid DEFAULT gen_random_uuid();

-- 3. Atualizar valores existentes com UUIDs únicos
UPDATE historico_whatsapp_grupos SET id_new = gen_random_uuid() WHERE id_new IS NULL;

-- 4. Remover a coluna id antiga
ALTER TABLE historico_whatsapp_grupos DROP COLUMN id;

-- 5. Renomear a nova coluna para id
ALTER TABLE historico_whatsapp_grupos RENAME COLUMN id_new TO id;

-- 6. Definir como NOT NULL
ALTER TABLE historico_whatsapp_grupos ALTER COLUMN id SET NOT NULL;

-- 7. Definir default
ALTER TABLE historico_whatsapp_grupos ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 8. Recriar a primary key
ALTER TABLE historico_whatsapp_grupos ADD PRIMARY KEY (id);