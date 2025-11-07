-- Função para extrair perfil do nome da turma
CREATE OR REPLACE FUNCTION extract_perfil_from_nome()
RETURNS TRIGGER AS $$
BEGIN
  -- Pega a última palavra do nome e remove o último caractere
  -- Exemplo: "Turma A1" -> "A1" -> "A"
  IF NEW.nome IS NOT NULL THEN
    NEW.perfil := LEFT(
      (regexp_split_to_array(TRIM(NEW.nome), '\s+'))[array_length(regexp_split_to_array(TRIM(NEW.nome), '\s+'), 1)],
      LENGTH((regexp_split_to_array(TRIM(NEW.nome), '\s+'))[array_length(regexp_split_to_array(TRIM(NEW.nome), '\s+'), 1)]) - 1
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para preencher perfil automaticamente
DROP TRIGGER IF EXISTS trigger_extract_perfil ON turmas;
CREATE TRIGGER trigger_extract_perfil
  BEFORE INSERT OR UPDATE OF nome
  ON turmas
  FOR EACH ROW
  EXECUTE FUNCTION extract_perfil_from_nome();

-- Atualizar perfis das turmas existentes
UPDATE turmas
SET perfil = LEFT(
  (regexp_split_to_array(TRIM(nome), '\s+'))[array_length(regexp_split_to_array(TRIM(nome), '\s+'), 1)],
  LENGTH((regexp_split_to_array(TRIM(nome), '\s+'))[array_length(regexp_split_to_array(TRIM(nome), '\s+'), 1)]) - 1
)
WHERE nome IS NOT NULL;