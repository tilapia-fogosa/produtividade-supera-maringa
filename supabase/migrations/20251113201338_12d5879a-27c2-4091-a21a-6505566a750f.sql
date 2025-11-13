-- Aumentar limite do bucket fotos-pessoas de 5MB para 10MB
UPDATE storage.buckets
SET file_size_limit = 10485760 -- 10MB em bytes
WHERE id = 'fotos-pessoas';