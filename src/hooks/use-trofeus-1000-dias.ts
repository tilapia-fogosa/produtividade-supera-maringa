import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface TrofeuAlunoData {
  id: string;
  nome: string;
  dias_supera: number | null;
  trofeu_pedido: boolean;
  trofeu_confeccionado: boolean;
  trofeu_entregue: boolean;
  turma_nome: string | null;
  professor_nome: string | null;
  trofeu_id: string | null;
}

export interface FiltrosTrofeus {
  trofeuPedido: 'todos' | 'sim' | 'nao';
  trofeuConfeccionado: 'todos' | 'sim' | 'nao';
  trofeuEntregue: 'todos' | 'sim' | 'nao';
}

export function useTrofeus1000Dias() {
  const [alunos, setAlunos] = useState<TrofeuAlunoData[]>([]);
  const [filteredAlunos, setFilteredAlunos] = useState<TrofeuAlunoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosTrofeus>({
    trofeuPedido: 'todos',
    trofeuConfeccionado: 'todos',
    trofeuEntregue: 'todos'
  });

  useEffect(() => {
    buscarDadosTrofeus();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [alunos, filtros]);

  const buscarDadosTrofeus = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Iniciando busca de dados dos troféus...');

      // Buscar alunos ativos com dados de turma e professor
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
        .gte('dias_supera', 800) // Mostrar apenas alunos próximos aos 1000 dias
        .order('dias_supera', { ascending: false });

      if (alunosError) {
        console.error('Erro na consulta de alunos:', alunosError);
        throw alunosError;
      }

      console.log('Dados dos alunos recebidos:', alunosData);

      if (!alunosData || alunosData.length === 0) {
        console.log('Nenhum aluno encontrado com 800+ dias');
        setAlunos([]);
        return;
      }

      // Buscar dados dos troféus existentes
      const alunoIds = alunosData.map(aluno => aluno.id);
      const { data: trofeusData, error: trofeusError } = await supabase
        .from('trofeus_1000_dias')
        .select('*')
        .in('aluno_id', alunoIds);

      if (trofeusError) {
        console.error('Erro ao buscar troféus:', trofeusError);
        // Continuar mesmo com erro nos troféus
      }

      console.log('Dados dos troféus recebidos:', trofeusData);

      // Combinar dados
      const alunosComTrofeus: TrofeuAlunoData[] = alunosData.map((aluno: any) => {
        const trofeu = trofeusData?.find(t => t.aluno_id === aluno.id);
        
        return {
          id: aluno.id,
          nome: aluno.nome,
          dias_supera: aluno.dias_supera,
          trofeu_pedido: trofeu?.trofeu_pedido || false,
          trofeu_confeccionado: trofeu?.trofeu_confeccionado || false,
          trofeu_entregue: trofeu?.trofeu_entregue || false,
          turma_nome: aluno.turmas?.nome || null,
          professor_nome: aluno.turmas?.professores?.nome || null,
          trofeu_id: trofeu?.id || null
        };
      });

      setAlunos(alunosComTrofeus);
      console.log(`Carregados ${alunosComTrofeus.length} alunos com dados de troféus`);

    } catch (err) {
      console.error('Erro ao buscar dados dos troféus:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao carregar dados dos troféus: ${errorMessage}`);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados dos troféus.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let result = [...alunos];

    if (filtros.trofeuPedido === 'sim') {
      result = result.filter(aluno => aluno.trofeu_pedido);
    } else if (filtros.trofeuPedido === 'nao') {
      result = result.filter(aluno => !aluno.trofeu_pedido);
    }

    if (filtros.trofeuConfeccionado === 'sim') {
      result = result.filter(aluno => aluno.trofeu_confeccionado);
    } else if (filtros.trofeuConfeccionado === 'nao') {
      result = result.filter(aluno => !aluno.trofeu_confeccionado);
    }

    if (filtros.trofeuEntregue === 'sim') {
      result = result.filter(aluno => aluno.trofeu_entregue);
    } else if (filtros.trofeuEntregue === 'nao') {
      result = result.filter(aluno => !aluno.trofeu_entregue);
    }

    setFilteredAlunos(result);
  };

  const atualizarTrofeu = async (alunoId: string, campo: 'trofeu_pedido' | 'trofeu_confeccionado' | 'trofeu_entregue', valor: boolean) => {
    try {
      const aluno = alunos.find(a => a.id === alunoId);
      if (!aluno) {
        throw new Error('Aluno não encontrado');
      }

      // Se não existe registro de troféu, criar um
      if (!aluno.trofeu_id) {
        const { data: novoTrofeu, error: insertError } = await supabase
          .from('trofeus_1000_dias')
          .insert({
            aluno_id: alunoId,
            [campo]: valor
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Atualizar estado local
        setAlunos(prev => prev.map(a => 
          a.id === alunoId 
            ? { ...a, [campo]: valor, trofeu_id: novoTrofeu.id }
            : a
        ));

      } else {
        // Atualizar registro existente
        const { error: updateError } = await supabase
          .from('trofeus_1000_dias')
          .update({ [campo]: valor })
          .eq('id', aluno.trofeu_id);

        if (updateError) throw updateError;

        // Atualizar estado local
        setAlunos(prev => prev.map(a => 
          a.id === alunoId 
            ? { ...a, [campo]: valor }
            : a
        ));
      }

    } catch (error) {
      console.error('Erro ao atualizar troféu:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o troféu.",
        variant: "destructive"
      });
    }
  };

  const limparFiltros = () => {
    setFiltros({
      trofeuPedido: 'todos',
      trofeuConfeccionado: 'todos',
      trofeuEntregue: 'todos'
    });
  };

  // Contador de alunos com +965 dias sem troféu entregue
  const contadorTrofeusNaoEntregues = alunos.filter(aluno => 
    (aluno.dias_supera || 0) >= 965 && !aluno.trofeu_entregue
  ).length;

  return {
    alunos: filteredAlunos,
    contadorTrofeusNaoEntregues,
    loading,
    error,
    filtros,
    setFiltros,
    atualizarTrofeu,
    limparFiltros,
    refetch: buscarDadosTrofeus
  };
}