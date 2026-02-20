-- Atualizar horario_inicio e horario_fim para turmas ativas com sala_id
-- Extrai horário do nome da turma e ajusta :01 para hora cheia
UPDATE turmas
SET 
  horario_inicio = (
    CASE 
      -- Se o minuto for 01, substitui por 00 (hora cheia)
      WHEN SUBSTRING(nome FROM '\((\d{2}):01') IS NOT NULL 
      THEN SUBSTRING(nome FROM '\((\d{2}):01') || ':00:00'
      -- Caso contrário, mantém o horário normal
      ELSE SUBSTRING(nome FROM '\((\d{2}:\d{2})') || ':00'
    END
  )::time,
  horario_fim = (
    CASE 
      -- Se o minuto for 01, calcula fim a partir da hora cheia
      WHEN SUBSTRING(nome FROM '\((\d{2}):01') IS NOT NULL 
      THEN (SUBSTRING(nome FROM '\((\d{2}):01') || ':00:00')::time + interval '2 hours'
      -- Caso contrário, calcula normalmente
      ELSE (SUBSTRING(nome FROM '\((\d{2}:\d{2})') || ':00')::time + interval '2 hours'
    END
  )::time
WHERE active = true 
  AND sala_id IS NOT NULL
  AND SUBSTRING(nome FROM '\((\d{2}:\d{2})') IS NOT NULL;