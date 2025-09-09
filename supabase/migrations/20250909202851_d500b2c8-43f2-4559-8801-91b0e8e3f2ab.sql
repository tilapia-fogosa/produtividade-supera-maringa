-- Desabilitar RLS nas tabelas de backup
ALTER TABLE IF EXISTS public.professores_backup1 DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.professores_backup2 DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.turmas_backup1 DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.turmas_backup2 DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas RLS das tabelas de backup
DROP POLICY IF EXISTS "Acesso público para visualizar professores backup1" ON public.professores_backup1;
DROP POLICY IF EXISTS "Acesso público para inserir professores backup1" ON public.professores_backup1;
DROP POLICY IF EXISTS "Acesso público para atualizar professores backup1" ON public.professores_backup1;
DROP POLICY IF EXISTS "Acesso público para deletar professores backup1" ON public.professores_backup1;

DROP POLICY IF EXISTS "Acesso público para visualizar professores backup2" ON public.professores_backup2;
DROP POLICY IF EXISTS "Acesso público para inserir professores backup2" ON public.professores_backup2;
DROP POLICY IF EXISTS "Acesso público para atualizar professores backup2" ON public.professores_backup2;
DROP POLICY IF EXISTS "Acesso público para deletar professores backup2" ON public.professores_backup2;

DROP POLICY IF EXISTS "Acesso público para visualizar turmas backup1" ON public.turmas_backup1;
DROP POLICY IF EXISTS "Acesso público para inserir turmas backup1" ON public.turmas_backup1;
DROP POLICY IF EXISTS "Acesso público para atualizar turmas backup1" ON public.turmas_backup1;
DROP POLICY IF EXISTS "Acesso público para deletar turmas backup1" ON public.turmas_backup1;

DROP POLICY IF EXISTS "Acesso público para visualizar turmas backup2" ON public.turmas_backup2;
DROP POLICY IF EXISTS "Acesso público para inserir turmas backup2" ON public.turmas_backup2;
DROP POLICY IF EXISTS "Acesso público para atualizar turmas backup2" ON public.turmas_backup2;
DROP POLICY IF EXISTS "Acesso público para deletar turmas backup2" ON public.turmas_backup2;