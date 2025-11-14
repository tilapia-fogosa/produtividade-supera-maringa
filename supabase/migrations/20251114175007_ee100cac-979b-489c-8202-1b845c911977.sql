-- Remover limite de tamanho do bucket fotos-pessoas para permitir imagens de alta qualidade
UPDATE storage.buckets 
SET file_size_limit = NULL
WHERE id = 'fotos-pessoas';

-- Também vamos aumentar o limite do bucket devolutivas-fotos se existir
UPDATE storage.buckets 
SET file_size_limit = NULL
WHERE id = 'devolutivas-fotos';