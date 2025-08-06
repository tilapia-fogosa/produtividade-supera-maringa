-- Desabilitar RLS temporariamente na tabela client_activities para restaurar funcionamento do outro sistema
ALTER TABLE public.client_activities DISABLE ROW LEVEL SECURITY;