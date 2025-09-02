import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Custom debounce hook para otimizar pesquisa
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface AlunoRetencao {
  id: string;
  nome: string;
  turma: string;
  educador: string;
  totalAlertas: number;
  alertasAtivos: number;
  totalRetencoes: number;
  ultimoAlerta: string | null;
  ultimaRetencao: string | null;
  status: 'critico' | 'alerta' | 'retencao' | 'normal';
  dadosAulaZero?: any;
}

interface RetencoesHistoricoParams {
  searchTerm: string;
  statusFilter: string;
}

interface Totals {
  totalAlunos: number;
  alertasAtivos: number;
  comRetencoes: number;
  criticos: number;
}

export function useRetencoesHistorico({ searchTerm, statusFilter }: RetencoesHistoricoParams) {
  const [alunos, setAlunos] = useState<AlunoRetencao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<Totals>({
    totalAlunos: 0,
    alertasAtivos: 0,
    comRetencoes: 0,
    criticos: 0
  });

  // Debounce do termo de busca para evitar muitas requisições
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchAlunosComHistorico = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar função RPC otimizada para buscar todos os dados em uma única consulta
      const { data, error: queryError } = await supabase
        .rpc('get_alunos_retencoes_historico', {
          p_search_term: debouncedSearchTerm || '',
          p_status_filter: statusFilter
        });

      if (queryError) {
        console.error('Erro na query RPC:', queryError);
        setError(queryError.message);
        return;
      }

      if (data) {
        // Transformar os dados para o formato esperado
        const alunosFormatados: AlunoRetencao[] = data.map((item: any) => ({
          id: item.id,
          nome: item.nome,
          turma: item.turma,
          educador: item.educador,
          totalAlertas: item.total_alertas,
          alertasAtivos: item.alertas_ativos,
          totalRetencoes: item.total_retencoes,
          ultimoAlerta: item.ultimo_alerta,
          ultimaRetencao: item.ultima_retencao,
          status: item.status as 'critico' | 'alerta' | 'retencao' | 'normal'
        }));

        setAlunos(alunosFormatados);
        
        // Calcular totais
        const totalAlunos = alunosFormatados.length;
        const alertasAtivosCount = alunosFormatados.filter(a => a.alertasAtivos > 0).length;
        const comRetencoesCount = alunosFormatados.filter(a => a.totalRetencoes > 0).length;
        const criticosCount = alunosFormatados.filter(a => a.status === 'critico').length;

        setTotals({
          totalAlunos,
          alertasAtivos: alertasAtivosCount,
          comRetencoes: comRetencoesCount,
          criticos: criticosCount
        });
      }
    } catch (err) {
      console.error('Erro ao buscar alunos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar histórico detalhado de um aluno específico
  const fetchHistoricoAluno = async (alunoId: string) => {
    try {
      // Buscar alertas
      const { data: alertas, error: alertasError } = await supabase
        .from('alerta_evasao')
        .select('*')
        .eq('aluno_id', alunoId)
        .order('created_at', { ascending: false });

      if (alertasError) {
        console.error('Erro ao buscar alertas:', alertasError);
        throw new Error(alertasError.message);
      }

      // Buscar retenções
      const { data: retencoes, error: retencoesError } = await supabase
        .from('retencoes')
        .select('*')
        .eq('aluno_id', alunoId)
        .order('created_at', { ascending: false });

      if (retencoesError) {
        console.error('Erro ao buscar retenções:', retencoesError);
        throw new Error(retencoesError.message);
      }

      // Buscar dados da aula zero (na tabela alunos)
      const { data: alunoData, error: alunoError } = await supabase
        .from('alunos')
        .select(`
          motivo_procura,
          percepcao_coordenador,
          avaliacao_abaco,
          avaliacao_ah,
          pontos_atencao,
          coordenador_responsavel
        `)
        .eq('id', alunoId)
        .single();

      if (alunoError) {
        console.error('Erro ao buscar dados do aluno:', alunoError);
        throw new Error(alunoError.message);
      }

      return {
        alertas: alertas || [],
        retencoes: retencoes || [],
        aulaZero: alunoData
      };
    } catch (err) {
      console.error('Erro ao buscar histórico do aluno:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAlunosComHistorico();
  }, [debouncedSearchTerm, statusFilter]);

  return {
    alunos,
    loading,
    error,
    totals,
    refetch: fetchAlunosComHistorico,
    fetchHistoricoAluno
  };
}