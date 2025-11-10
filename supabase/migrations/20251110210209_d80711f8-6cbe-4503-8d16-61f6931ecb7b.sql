-- Limpar fotos de devolutiva dos alunos
UPDATE public.alunos 
SET foto_devolutiva_url = NULL 
WHERE foto_devolutiva_url IS NOT NULL;

-- Limpar fotos de devolutiva dos funcionários
UPDATE public.funcionarios 
SET foto_devolutiva_url = NULL 
WHERE foto_devolutiva_url IS NOT NULL;