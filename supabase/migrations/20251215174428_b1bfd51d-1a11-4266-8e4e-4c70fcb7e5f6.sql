-- Adicionar coluna professor_id na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS professor_id uuid REFERENCES professores(id);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_professor_id ON profiles(professor_id);

-- Executar vinculação inicial para usuários existentes baseado no email
UPDATE profiles p
SET professor_id = pr.id
FROM professores pr
WHERE LOWER(TRIM(p.email)) = LOWER(TRIM(pr.email))
  AND pr.status = true
  AND p.professor_id IS NULL;

-- Criar função para vincular automaticamente novos usuários
CREATE OR REPLACE FUNCTION public.link_profile_to_professor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Tenta vincular automaticamente por email quando o profile é criado ou email atualizado
  IF NEW.email IS NOT NULL AND NEW.professor_id IS NULL THEN
    SELECT pr.id INTO NEW.professor_id
    FROM professores pr
    WHERE LOWER(TRIM(pr.email)) = LOWER(TRIM(NEW.email))
      AND pr.status = true
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para vincular automaticamente em INSERT
DROP TRIGGER IF EXISTS on_profile_created_link_professor ON profiles;
CREATE TRIGGER on_profile_created_link_professor
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.link_profile_to_professor();

-- Criar trigger para vincular automaticamente em UPDATE do email
DROP TRIGGER IF EXISTS on_profile_updated_link_professor ON profiles;
CREATE TRIGGER on_profile_updated_link_professor
  BEFORE UPDATE OF email ON profiles
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.link_profile_to_professor();