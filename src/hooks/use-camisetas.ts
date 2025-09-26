import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface CamisetaAlunoData {
  id: string;
  nome: string;
  dias_supera: number | null;
  camiseta_entregue: boolean;
  turma_nome: string | null;
  professor_nome: string | null;
  camiseta_id: string | null;
}

export function useCamisetas() {
  const [alunos, setAlunos] = useState<CamisetaAlunoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    buscarDadosCamisetas();
  }, []);

  const buscarDadosCamisetas = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Iniciando busca de dados das camisetas...');

      // Buscar alunos ativos com mais de 60 dias
      const { data: alunosData, error: alunosError } = await supabase
        .from('alunos')
        .select(`
          id,
          nome,
          dias_supera,
          turma_id,
          turmas!inner(
            id,
            nome,
            professor_id,
            professores(
              id,
              nome
            )
          )
        `)
        .eq('active', true)
        .not('dias_supera', 'is', null)
        .gte('dias_supera', 60) // Alunos com 60+ dias (2 meses)
        .order('dias_supera', { ascending: false });

      if (alunosError) {
        console.error('Erro na consulta de alunos:', alunosError);
        throw alunosError;
      }

      console.log('Dados dos alunos recebidos:', alunosData);

      if (!alunosData || alunosData.length === 0) {
        console.log('Nenhum aluno encontrado com 60+ dias');
        setAlunos([]);
        return;
      }

      // Buscar dados das camisetas existentes
      const alunoIds = alunosData.map(aluno => aluno.id);
      const { data: camisetasData, error: camisetasError } = await supabase
        .from('camisetas')
        .select('*')
        .in('aluno_id', alunoIds);

      if (camisetasError) {
        console.error('Erro ao buscar camisetas:', camisetasError);
        // Continuar mesmo com erro nas camisetas
      }

      console.log('Dados das camisetas recebidos:', camisetasData);

      // Combinar dados
      const alunosComCamisetas: CamisetaAlunoData[] = alunosData.map((aluno: any) => {
        const camiseta = camisetasData?.find(c => c.aluno_id === aluno.id);
        
        return {
          id: aluno.id,
          nome: aluno.nome,
          dias_supera: aluno.dias_supera,
          camiseta_entregue: camiseta?.camiseta_entregue || false,
          turma_nome: aluno.turmas?.nome || null,
          professor_nome: aluno.turmas?.professores?.nome || null,
          camiseta_id: camiseta?.id || null
        };
      });

      setAlunos(alunosComCamisetas);
      console.log(`Carregados ${alunosComCamisetas.length} alunos com dados de camisetas`);

    } catch (err) {
      console.error('Erro ao buscar dados das camisetas:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao carregar dados das camisetas: ${errorMessage}`);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados das camisetas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const atualizarCamiseta = async (alunoId: string, entregue: boolean) => {
    try {
      const aluno = alunos.find(a => a.id === alunoId);
      if (!aluno) {
        throw new Error('Aluno não encontrado');
      }

      // Se não existe registro de camiseta, criar um
      if (!aluno.camiseta_id) {
        const { data: novaCamiseta, error: insertError } = await supabase
          .from('camisetas')
          .insert({
            aluno_id: alunoId,
            camiseta_entregue: entregue,
            data_entrega: entregue ? new Date().toISOString() : null
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Atualizar estado local
        setAlunos(prev => prev.map(a => 
          a.id === alunoId 
            ? { ...a, camiseta_entregue: entregue, camiseta_id: novaCamiseta.id }
            : a
        ));

      } else {
        // Atualizar registro existente
        const { error: updateError } = await supabase
          .from('camisetas')
          .update({ 
            camiseta_entregue: entregue,
            data_entrega: entregue ? new Date().toISOString() : null
          })
          .eq('id', aluno.camiseta_id);

        if (updateError) throw updateError;

        // Atualizar estado local
        setAlunos(prev => prev.map(a => 
          a.id === alunoId 
            ? { ...a, camiseta_entregue: entregue }
            : a
        ));
      }

      toast({
        title: "Sucesso",
        description: `Camiseta ${entregue ? 'marcada como entregue' : 'desmarcada'}.`,
        variant: "default"
      });

    } catch (error) {
      console.error('Erro ao atualizar camiseta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a camiseta.",
        variant: "destructive"
      });
    }
  };

  // Contador de alunos com +90 dias sem camiseta entregue
  const contadorCamisetasNaoEntregues = alunos.filter(aluno => 
    (aluno.dias_supera || 0) >= 90 && !aluno.camiseta_entregue
  ).length;

  return {
    alunos,
    contadorCamisetasNaoEntregues,
    loading,
    error,
    atualizarCamiseta,
    refetch: buscarDadosCamisetas
  };
}