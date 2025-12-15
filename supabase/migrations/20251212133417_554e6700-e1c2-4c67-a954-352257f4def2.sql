-- Fase 7.0: Vincular profiles a funcionarios

-- 1. Adicionar coluna funcionario_id na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS funcionario_id uuid REFERENCES public.funcionarios(id);

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_funcionario_id ON public.profiles(funcionario_id);

-- 3. Popular vínculos existentes baseado no email
UPDATE public.profiles p
SET funcionario_id = f.id
FROM public.funcionarios f
WHERE LOWER(TRIM(p.email)) = LOWER(TRIM(f.email))
  AND f.active = true
  AND p.funcionario_id IS NULL;