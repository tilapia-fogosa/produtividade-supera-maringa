-- Migration to add 'digitalizar_contrato_remover_arquivos' to tipo_atividade_evasao enum

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'tipo_atividade_evasao' AND e.enumlabel = 'digitalizar_contrato_remover_arquivos') THEN
    ALTER TYPE tipo_atividade_evasao ADD VALUE 'digitalizar_contrato_remover_arquivos';
  END IF;
END
$$;
