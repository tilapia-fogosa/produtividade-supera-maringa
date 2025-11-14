-- Criar tabela de controle de devolutivas
CREATE TABLE IF NOT EXISTS public.devolutivas_controle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL,
  tipo_pessoa TEXT NOT NULL CHECK (tipo_pessoa IN ('aluno', 'funcionario')),
  foto_escolhida BOOLEAN DEFAULT false,
  impresso BOOLEAN DEFAULT false,
  entregue BOOLEAN DEFAULT false,
  impresso_em TIMESTAMP WITH TIME ZONE,
  entregue_em TIMESTAMP WITH TIME ZONE,
  impresso_por UUID REFERENCES auth.users(id),
  entregue_por UUID REFERENCES auth.users(id),
  unit_id UUID REFERENCES public.units(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(pessoa_id, tipo_pessoa)
);

-- Habilitar RLS
ALTER TABLE public.devolutivas_controle ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver devolutivas de sua unidade"
  ON public.devolutivas_controle
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.unit_users
      WHERE unit_users.unit_id = devolutivas_controle.unit_id
      AND unit_users.user_id = auth.uid()
      AND unit_users.active = true
    )
  );

CREATE POLICY "Usuários podem atualizar devolutivas de sua unidade"
  ON public.devolutivas_controle
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.unit_users
      WHERE unit_users.unit_id = devolutivas_controle.unit_id
      AND unit_users.user_id = auth.uid()
      AND unit_users.active = true
    )
  );

CREATE POLICY "Usuários podem inserir devolutivas de sua unidade"
  ON public.devolutivas_controle
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.unit_users
      WHERE unit_users.unit_id = devolutivas_controle.unit_id
      AND unit_users.user_id = auth.uid()
      AND unit_users.active = true
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_devolutivas_controle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_devolutivas_controle_updated_at
  BEFORE UPDATE ON public.devolutivas_controle
  FOR EACH ROW
  EXECUTE FUNCTION public.update_devolutivas_controle_updated_at();

-- Função para sincronizar foto_escolhida automaticamente
CREATE OR REPLACE FUNCTION public.sync_devolutivas_foto_escolhida()
RETURNS void AS $$
BEGIN
  -- Inserir ou atualizar registros de alunos
  INSERT INTO public.devolutivas_controle (pessoa_id, tipo_pessoa, foto_escolhida, unit_id)
  SELECT 
    a.id,
    'aluno',
    CASE WHEN a.foto_devolutiva_url IS NOT NULL THEN true ELSE false END,
    t.unit_id
  FROM public.alunos a
  LEFT JOIN public.turmas t ON a.turma_id = t.id
  WHERE a.active = true
  ON CONFLICT (pessoa_id, tipo_pessoa) 
  DO UPDATE SET 
    foto_escolhida = CASE WHEN EXCLUDED.foto_escolhida THEN true ELSE devolutivas_controle.foto_escolhida END,
    updated_at = now();

  -- Inserir ou atualizar registros de funcionários
  INSERT INTO public.devolutivas_controle (pessoa_id, tipo_pessoa, foto_escolhida, unit_id)
  SELECT 
    f.id,
    'funcionario',
    CASE WHEN f.foto_devolutiva_url IS NOT NULL THEN true ELSE false END,
    f.unit_id
  FROM public.funcionarios f
  WHERE f.active = true
  ON CONFLICT (pessoa_id, tipo_pessoa) 
  DO UPDATE SET 
    foto_escolhida = CASE WHEN EXCLUDED.foto_escolhida THEN true ELSE devolutivas_controle.foto_escolhida END,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar sincronização inicial
SELECT public.sync_devolutivas_foto_escolhida();

-- Trigger para atualizar foto_escolhida quando foto_devolutiva_url mudar em alunos
CREATE OR REPLACE FUNCTION public.update_devolutivas_foto_aluno()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.devolutivas_controle (pessoa_id, tipo_pessoa, foto_escolhida, unit_id)
  SELECT NEW.id, 'aluno', true, t.unit_id
  FROM public.turmas t
  WHERE t.id = NEW.turma_id
  ON CONFLICT (pessoa_id, tipo_pessoa) 
  DO UPDATE SET 
    foto_escolhida = true,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_devolutivas_foto_aluno
  AFTER UPDATE OF foto_devolutiva_url ON public.alunos
  FOR EACH ROW
  WHEN (NEW.foto_devolutiva_url IS NOT NULL AND (OLD.foto_devolutiva_url IS NULL OR OLD.foto_devolutiva_url != NEW.foto_devolutiva_url))
  EXECUTE FUNCTION public.update_devolutivas_foto_aluno();

-- Trigger para atualizar foto_escolhida quando foto_devolutiva_url mudar em funcionarios
CREATE OR REPLACE FUNCTION public.update_devolutivas_foto_funcionario()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.devolutivas_controle (pessoa_id, tipo_pessoa, foto_escolhida, unit_id)
  VALUES (NEW.id, 'funcionario', true, NEW.unit_id)
  ON CONFLICT (pessoa_id, tipo_pessoa) 
  DO UPDATE SET 
    foto_escolhida = true,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_devolutivas_foto_funcionario
  AFTER UPDATE OF foto_devolutiva_url ON public.funcionarios
  FOR EACH ROW
  WHEN (NEW.foto_devolutiva_url IS NOT NULL AND (OLD.foto_devolutiva_url IS NULL OR OLD.foto_devolutiva_url != NEW.foto_devolutiva_url))
  EXECUTE FUNCTION public.update_devolutivas_foto_funcionario();

-- Criar índices para melhor performance
CREATE INDEX idx_devolutivas_controle_pessoa ON public.devolutivas_controle(pessoa_id, tipo_pessoa);
CREATE INDEX idx_devolutivas_controle_unit ON public.devolutivas_controle(unit_id);
CREATE INDEX idx_devolutivas_controle_status ON public.devolutivas_controle(foto_escolhida, impresso, entregue);