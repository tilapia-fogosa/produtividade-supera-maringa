-- Fazer backup completo da tabela clients
INSERT INTO public.clients_backup 
SELECT * FROM public.clients;

-- Agora desativar os clientes das unidades específicas
UPDATE public.clients 
SET 
  active = false, 
  updated_at = NOW()
WHERE unit_id IN (
  '355330f9-2ffa-42f5-8f4d-9f69f0f843b5',
  '009618a9-2f48-43c8-9c22-b6c86f7ec8d3',
  '0b5067cd-0851-4af8-925a-10177fd0e9de',
  '43bf52bb-0c86-47ab-a5ad-f28b27746c95',
  'efe73169-22c5-4d9c-93ef-85ed93cc83b8',
  'c4c8eee6-f287-4f16-a8bf-df5995e1ef2e',
  '7bdadb2f-fc62-428b-acd3-df176a54ac3e'
)
AND active = true;