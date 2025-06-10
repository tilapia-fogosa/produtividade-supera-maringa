
-- Função RPC para buscar produtividade do ábaco sem duplicatas
CREATE OR REPLACE FUNCTION get_produtividade_abaco_limpa(
  p_pessoa_id UUID,
  p_data_inicial DATE,
  p_data_final DATE
)
RETURNS TABLE(
  id UUID,
  pessoa_id UUID,
  tipo_pessoa TEXT,
  data_aula DATE,
  presente BOOLEAN,
  apostila TEXT,
  pagina TEXT,
  exercicios INTEGER,
  erros INTEGER,
  fez_desafio BOOLEAN,
  comentario TEXT,
  motivo_falta TEXT,
  is_reposicao BOOLEAN,
  aluno_nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (pa.data_aula)
    pa.id,
    pa.pessoa_id,
    pa.tipo_pessoa,
    pa.data_aula,
    pa.presente,
    pa.apostila,
    pa.pagina,
    pa.exercicios,
    pa.erros,
    pa.fez_desafio,
    pa.comentario,
    pa.motivo_falta,
    pa.is_reposicao,
    pa.aluno_nome,
    pa.created_at,
    pa.updated_at
  FROM produtividade_abaco pa
  WHERE pa.pessoa_id = p_pessoa_id
    AND pa.data_aula >= p_data_inicial
    AND pa.data_aula <= p_data_final
    AND (pa.exercicios > 0 OR pa.presente = false) -- Filtra registros inválidos (exercicios = 0) exceto faltas
  ORDER BY pa.data_aula, 
           pa.presente DESC,  -- Prioriza presentes
           pa.exercicios DESC NULLS LAST, -- Prioriza mais exercícios
           pa.created_at ASC; -- Em caso de empate, pega o mais antigo
END;
$$;

-- Conceder permissões para usar a função
GRANT EXECUTE ON FUNCTION get_produtividade_abaco_limpa(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_produtividade_abaco_limpa(UUID, DATE, DATE) TO anon;
