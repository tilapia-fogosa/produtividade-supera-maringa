-- Tornar o bucket wpp_pedagogico público para que as mídias sejam acessíveis
UPDATE storage.buckets 
SET public = true 
WHERE id = 'wpp_pedagogico';