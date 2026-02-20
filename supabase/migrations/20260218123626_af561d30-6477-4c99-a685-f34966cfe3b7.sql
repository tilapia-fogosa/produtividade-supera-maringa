
ALTER TABLE public.comissao_config
ADD COLUMN aceleradores JSONB NOT NULL DEFAULT '[]'::jsonb;
