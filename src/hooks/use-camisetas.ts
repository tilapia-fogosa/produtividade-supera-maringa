import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface CamisetaAlunoData {
  id: string;
  nome: string;
  dias_supera: number | null;
  camiseta_entregue: boolean;
  nao_tem_tamanho: boolean;
  turma_nome: string | null;
  professor_nome: string | null;
  camiseta_id: string | null;
  tamanho_camiseta?: string | null;
  data_entrega?: string | null;
  responsavel_entrega_nome?: string | null;
  observacoes?: string | null;
}

export function useCamisetas() {
  const [alunos, setAlunos] = useState<CamisetaAlunoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<'pendentes' | 'todos'>('pendentes');

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
        .select('id, aluno_id, camiseta_entregue, nao_tem_tamanho, tamanho_camiseta, data_entrega, responsavel_entrega_nome, responsavel_entrega_id, responsavel_entrega_tipo, observacoes')
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
          nao_tem_tamanho: camiseta?.nao_tem_tamanho || false,
          turma_nome: aluno.turmas?.nome || null,
          professor_nome: aluno.turmas?.professores?.nome || null,
          camiseta_id: camiseta?.id || null,
          tamanho_camiseta: camiseta?.tamanho_camiseta || null,
          data_entrega: camiseta?.data_entrega || null,
          responsavel_entrega_nome: camiseta?.responsavel_entrega_nome || null,
          observacoes: camiseta?.observacoes || null
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

  const marcarComoNaoEntregue = async (alunoId: string) => {
    try {
      const aluno = alunos.find(a => a.id === alunoId);
      if (!aluno || !aluno.camiseta_id) return;

      // Atualizar registro para não entregue
      const { error } = await supabase
        .from('camisetas')
        .update({ 
          camiseta_entregue: false,
          nao_tem_tamanho: false,
          data_entrega: null,
          tamanho_camiseta: null,
          responsavel_entrega_id: null,
          responsavel_entrega_tipo: null,
          responsavel_entrega_nome: null,
          observacoes: null
        })
        .eq('id', aluno.camiseta_id);

      if (error) throw error;

      // Atualizar estado local
      setAlunos(prev => prev.map(a => 
        a.id === alunoId 
          ? { 
              ...a, 
              camiseta_entregue: false,
              nao_tem_tamanho: false,
              tamanho_camiseta: null,
              data_entrega: null,
              responsavel_entrega_nome: null,
              observacoes: null
            }
          : a
      ));

      toast({
        title: "Sucesso",
        description: "Camiseta desmarcada como entregue.",
        variant: "default"
      });

    } catch (error) {
      console.error('Erro ao desmarcar camiseta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desmarcar a camiseta.",
        variant: "destructive"
      });
    }
  };

  const marcarComoEntregue = async (alunoId: string) => {
    try {
      const aluno = alunos.find(a => a.id === alunoId);
      if (!aluno) return;

      // Criar ou atualizar registro de camiseta como entregue
      const { error } = await supabase
        .from('camisetas')
        .upsert({
          aluno_id: alunoId,
          camiseta_entregue: true,
          nao_tem_tamanho: false,
          data_entrega: new Date().toISOString(),
        }, { onConflict: 'aluno_id' });

      if (error) throw error;

      // Atualizar estado local
      setAlunos(prev => prev.map(a => 
        a.id === alunoId 
          ? { 
              ...a, 
              camiseta_entregue: true,
              nao_tem_tamanho: false,
              data_entrega: new Date().toISOString()
            }
          : a
      ));

      toast({
        title: "Sucesso",
        description: "Camiseta marcada como entregue.",
        variant: "default"
      });

    } catch (error) {
      console.error('Erro ao marcar camiseta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar a camiseta como entregue.",
        variant: "destructive"
      });
    }
  };

  const marcarComoEntregueComDetalhes = async (dados: {
    alunoId: string;
    tamanho_camiseta: string;
    responsavel_id: string;
    responsavel_tipo: string;
    responsavel_nome: string;
    data_entrega: Date;
    observacoes?: string;
  }) => {
    try {
      // Criar ou atualizar registro de camiseta com todos os detalhes
      const { error } = await supabase
        .from('camisetas')
        .upsert({
          aluno_id: dados.alunoId,
          camiseta_entregue: true,
          nao_tem_tamanho: false,
          tamanho_camiseta: dados.tamanho_camiseta,
          responsavel_entrega_id: dados.responsavel_id,
          responsavel_entrega_tipo: dados.responsavel_tipo,
          responsavel_entrega_nome: dados.responsavel_nome,
          data_entrega: dados.data_entrega.toISOString(),
          observacoes: dados.observacoes || null,
        }, { onConflict: 'aluno_id' });

      if (error) throw error;

      // Atualizar estado local
      setAlunos(prev => prev.map(a => 
        a.id === dados.alunoId 
          ? { 
              ...a, 
              camiseta_entregue: true,
              nao_tem_tamanho: false,
              tamanho_camiseta: dados.tamanho_camiseta,
              responsavel_entrega_nome: dados.responsavel_nome,
              data_entrega: dados.data_entrega.toISOString(),
              observacoes: dados.observacoes || null
            }
          : a
      ));

      toast({
        title: "Sucesso",
        description: "Camiseta marcada como entregue com todos os detalhes.",
        variant: "default"
      });

    } catch (error) {
      console.error('Erro ao marcar camiseta com detalhes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar a camiseta como entregue.",
        variant: "destructive"
      });
      throw error; // Re-throw para o modal tratar
    }
  };

  const marcarComoNaoTemTamanho = async (alunoId: string, checked: boolean) => {
    try {
      if (checked) {
        // Marcar como "não tem tamanho"
        const { error } = await supabase
          .from('camisetas')
          .upsert({
            aluno_id: alunoId,
            nao_tem_tamanho: true,
            camiseta_entregue: false,
            observacoes: 'Não há tamanho disponível'
          }, { onConflict: 'aluno_id' });

        if (error) throw error;

        // Atualizar estado local
        setAlunos(prev => prev.map(a => 
          a.id === alunoId 
            ? { 
                ...a, 
                nao_tem_tamanho: true,
                camiseta_entregue: false,
                observacoes: 'Não há tamanho disponível'
              }
            : a
        ));

        toast({
          title: "Sucesso",
          description: "Marcado como 'não tem tamanho'.",
          variant: "default"
        });

      } else {
        // Desmarcar "não tem tamanho"
        const aluno = alunos.find(a => a.id === alunoId);
        if (aluno?.camiseta_id) {
          const { error } = await supabase
            .from('camisetas')
            .update({ 
              nao_tem_tamanho: false,
              observacoes: null,
              responsavel_entrega_nome: null,
              responsavel_entrega_id: null,
              responsavel_entrega_tipo: null
            })
            .eq('id', aluno.camiseta_id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('camisetas')
            .upsert({
              aluno_id: alunoId,
              nao_tem_tamanho: false,
              camiseta_entregue: false,
              observacoes: null
            }, { onConflict: 'aluno_id' });

          if (error) throw error;
        }

        setAlunos(prev => prev.map(a => 
          a.id === alunoId 
            ? { ...a, nao_tem_tamanho: false, observacoes: null, responsavel_entrega_nome: null }
            : a
        ));

        toast({
          title: "Sucesso",
          description: "Marcação removida.",
          variant: "default"
        });
      }

    } catch (error) {
      console.error('Erro ao atualizar não tem tamanho:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar.",
        variant: "destructive"
      });
    }
  };

  // Filtrar alunos baseado no filtro selecionado
  const alunosFiltrados = alunos.filter(aluno => {
    if (filtro === 'pendentes') {
      // Mostrar apenas alunos que não receberam camiseta e não foram marcados como "não tem tamanho"
      return !aluno.camiseta_entregue && !aluno.nao_tem_tamanho;
    }
    return true; // 'todos' - mostrar todos os alunos
  });

  // Contador de alunos com +90 dias sem camiseta entregue e que não foram marcados como "não tem tamanho"
  const contadorCamisetasNaoEntregues = alunos.filter(aluno => 
    (aluno.dias_supera || 0) >= 90 && !aluno.camiseta_entregue && !aluno.nao_tem_tamanho
  ).length;

  return {
    alunos: alunosFiltrados,
    todosAlunos: alunos,
    contadorCamisetasNaoEntregues,
    loading,
    error,
    filtro,
    setFiltro,
    marcarComoEntregue,
    marcarComoEntregueComDetalhes,
    marcarComoNaoEntregue,
    marcarComoNaoTemTamanho,
    refetch: buscarDadosCamisetas
  };
}