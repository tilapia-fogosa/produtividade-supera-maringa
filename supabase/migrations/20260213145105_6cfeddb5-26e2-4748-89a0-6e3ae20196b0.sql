ALTER TABLE public.eventos_professor 
ADD COLUMN client_id UUID REFERENCES public.clients(id);