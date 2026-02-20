
-- Primeiro, vamos verificar as inconsistências antes da correção
SELECT 'produtividade_abaco' as tabela, COUNT(*) as total_inconsistencias
FROM produtividade_abaco pa
JOIN alunos a ON pa.aluno_nome = a.nome
WHERE pa.pessoa_id != a.id AND pa.tipo_pessoa = 'aluno'

UNION ALL

SELECT 'produtividade_ah' as tabela, COUNT(*) as total_inconsistencias  
FROM produtividade_ah pah
JOIN alunos a ON pah.aluno_nome = a.nome
WHERE pah.pessoa_id != a.id AND pah.tipo_pessoa = 'aluno';

-- Corrigir os IDs na tabela produtividade_abaco
UPDATE produtividade_abaco 
SET pessoa_id = alunos.id
FROM alunos
WHERE produtividade_abaco.aluno_nome = alunos.nome 
  AND produtividade_abaco.pessoa_id != alunos.id 
  AND produtividade_abaco.tipo_pessoa = 'aluno';

-- Corrigir os IDs na tabela produtividade_ah
UPDATE produtividade_ah 
SET pessoa_id = alunos.id
FROM alunos
WHERE produtividade_ah.aluno_nome = alunos.nome 
  AND produtividade_ah.pessoa_id != alunos.id 
  AND produtividade_ah.tipo_pessoa = 'aluno';

-- Verificar se ainda existem inconsistências após a correção
SELECT 'produtividade_abaco_pos_correcao' as tabela, COUNT(*) as total_inconsistencias
FROM produtividade_abaco pa
JOIN alunos a ON pa.aluno_nome = a.nome
WHERE pa.pessoa_id != a.id AND pa.tipo_pessoa = 'aluno'

UNION ALL

SELECT 'produtividade_ah_pos_correcao' as tabela, COUNT(*) as total_inconsistencias  
FROM produtividade_ah pah
JOIN alunos a ON pah.aluno_nome = a.nome
WHERE pah.pessoa_id != a.id AND pah.tipo_pessoa = 'aluno';

-- Mostrar estatísticas finais das tabelas
SELECT 'produtividade_abaco_final' as tabela, COUNT(*) as total_registros
FROM produtividade_abaco WHERE tipo_pessoa = 'aluno'

UNION ALL

SELECT 'produtividade_ah_final' as tabela, COUNT(*) as total_registros  
FROM produtividade_ah WHERE tipo_pessoa = 'aluno';
