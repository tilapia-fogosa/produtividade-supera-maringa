-- Remove a função antiga sem parâmetro que está causando conflito de overloading
DROP FUNCTION IF EXISTS public.get_lista_completa_reposicoes();