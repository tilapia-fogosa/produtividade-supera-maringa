-- Adicionar colunas de documentos e endereço na tabela alunos
-- para sincronizar com os dados salvos no formulário de Dados Cadastrais

-- Documentos
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS rg TEXT;

-- Endereço completo
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS endereco_cep TEXT;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS endereco_rua TEXT;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS endereco_numero TEXT;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS endereco_complemento TEXT;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS endereco_bairro TEXT;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS endereco_cidade TEXT;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS endereco_estado TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.alunos.cpf IS 'CPF do aluno (apenas números)';
COMMENT ON COLUMN public.alunos.rg IS 'RG do aluno';
COMMENT ON COLUMN public.alunos.endereco_cep IS 'CEP do endereço (apenas números)';
COMMENT ON COLUMN public.alunos.endereco_rua IS 'Rua/Logradouro';
COMMENT ON COLUMN public.alunos.endereco_numero IS 'Número do endereço';
COMMENT ON COLUMN public.alunos.endereco_complemento IS 'Complemento do endereço';
COMMENT ON COLUMN public.alunos.endereco_bairro IS 'Bairro';
COMMENT ON COLUMN public.alunos.endereco_cidade IS 'Cidade';
COMMENT ON COLUMN public.alunos.endereco_estado IS 'Estado (sigla UF)';