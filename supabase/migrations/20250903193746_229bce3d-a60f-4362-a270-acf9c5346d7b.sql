-- Definir o primeiro usuário como administrador para testes
UPDATE profiles 
SET is_admin = true 
WHERE email = 'everson@equipesupera.com.br';