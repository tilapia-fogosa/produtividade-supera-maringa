
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface AlunoAtivo {
  id: string;
  nome: string;
  turma_id: string | null;
  turma_nome: string | null;
  professor_nome: string | null;
  ultima_apostila: string | null;
  dias_supera: number | null;
  active: boolean;
}

interface AlunoQueryResult {
  id: string;
  nome: string;
  turma_id: string | null;
  dias_supera: number | null;
  active: boolean;
  turmas: {
    nome: string;
    professores: {
      nome: string;
    } | null;
  } | null;
}

export function useAlunosAtivos() {
  const [alunos, setAlunos] = useState<AlunoAtivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    buscarAlunosAtivos();
  }, []);

  const buscarAlunosAtivos = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Iniciando busca de alunos ativos...');

      // Buscar alunos ativos com informações das turmas e professores
      const { data: alunosData, error: alunosError } = await supabase
        .from('alunos')
        .select(`
          id,
          nome,
          turma_id,
          dias_supera,
          active,
          turmas!left (
            nome,
            professores!left (
              nome
            )
          )
        `)
        .eq('active', true)
        .order('nome') as { data: AlunoQueryResult[] | null, error: any };

      if (alunosError) {
        console.error('Erro na consulta de alunos:', alunosError);
        throw alunosError;
      }

      console.log('Dados recebidos do Supabase:', alunosData);

      if (!alunosData) {
        console.log('Nenhum dado retornado');
        setAlunos([]);
        return;
      }

      // Mapear dados dos alunos com informações das turmas e professores
      const alunosComDados = await Promise.all(
        alunosData.map(async (aluno: AlunoQueryResult) => {
          console.log('Processando aluno:', aluno.nome);
          
          // Buscar a última apostila registrada no ábaco
          const { data: ultimaApostila, error: apostilaError } = await supabase
            .from('produtividade_abaco')
            .select('apostila')
            .eq('aluno_id', aluno.id)
            .not('apostila', 'is', null)
            .order('data_aula', { ascending: false })
            .limit(1);

          if (apostilaError) {
            console.error('Erro ao buscar última apostila para aluno', aluno.nome, ':', apostilaError);
          }

          const alunoProcessado: AlunoAtivo = {
            id: aluno.id,
            nome: aluno.nome,
            turma_id: aluno.turma_id,
            turma_nome: aluno.turmas?.nome || null,
            professor_nome: aluno.turmas?.professores?.nome || null,
            ultima_apostila: ultimaApostila && ultimaApostila.length > 0 ? ultimaApostila[0].apostila : null,
            dias_supera: aluno.dias_supera,
            active: aluno.active,
          };

          console.log('Aluno processado:', alunoProcessado);
          return alunoProcessado;
        })
      );

      setAlunos(alunosComDados);
      console.log(`Carregados ${alunosComDados.length} alunos ativos com sucesso`);

    } catch (err) {
      console.error('Erro ao buscar alunos ativos:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao carregar alunos ativos: ${errorMessage}`);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de alunos ativos. Verifique o console para mais detalhes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    alunos,
    loading,
    error,
    refetch: buscarAlunosAtivos
  };
}
