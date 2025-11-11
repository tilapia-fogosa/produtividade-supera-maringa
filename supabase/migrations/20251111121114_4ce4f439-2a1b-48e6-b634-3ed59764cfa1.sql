-- Copiar fotos existentes de foto_url para foto_devolutiva_url em funcionarios
UPDATE funcionarios 
SET foto_devolutiva_url = foto_url 
WHERE foto_devolutiva_url IS NULL AND foto_url IS NOT NULL;