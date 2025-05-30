
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

      // Buscar alunos ativos com informações das turmas e professores
      const { data: alunosData, error: alunosError } = await supabase
        .from('alunos')
        .select(`
          id,
          nome,
          turma_id,
          dias_supera,
          active,
          turmas (
            nome,
            professores (
              nome
            )
          )
        `)
        .eq('active', true)
        .order('nome');

      if (alunosError) throw alunosError;

      // Buscar a última apostila registrada para cada aluno
      const alunosComApostila = await Promise.all(
        (alunosData || []).map(async (aluno) => {
          // Buscar a última apostila registrada no ábaco
          const { data: ultimaApostila, error: apostilaError } = await supabase
            .from('produtividade_abaco')
            .select('apostila')
            .eq('aluno_id', aluno.id)
            .not('apostila', 'is', null)
            .order('data_aula', { ascending: false })
            .limit(1);

          if (apostilaError) {
            console.error('Erro ao buscar última apostila:', apostilaError);
          }

          return {
            id: aluno.id,
            nome: aluno.nome,
            turma_id: aluno.turma_id,
            turma_nome: aluno.turmas?.nome || null,
            professor_nome: aluno.turmas?.professores?.nome || null,
            ultima_apostila: ultimaApostila && ultimaApostila.length > 0 ? ultimaApostila[0].apostila : null,
            dias_supera: aluno.dias_supera,
            active: aluno.active,
          } as AlunoAtivo;
        })
      );

      setAlunos(alunosComApostila);
      console.log(`Carregados ${alunosComApostila.length} alunos ativos`);

    } catch (err) {
      console.error('Erro ao buscar alunos ativos:', err);
      setError('Erro ao carregar alunos ativos. Tente novamente.');
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de alunos ativos.",
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
