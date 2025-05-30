
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export type PeriodoFiltro = 'mes' | 'trimestre' | 'quadrimestre' | 'semestre' | 'ano';

export interface DesempenhoAH {
  mes: string;
  livro: string;
  exercicios: number;
  erros: number;
  percentual_acerto: number;
}

export interface FuncionarioDevolutivaData {
  id: string;
  nome: string;
  texto_devolutiva: string | null;
  texto_geral: string | null;
  desempenho_ah: DesempenhoAH[];
  ah_total_exercicios: number;
  ah_total_erros: number;
  ah_percentual_total: number;
}

interface FuncionarioDevolutivaRPCResponse {
  id: string;
  nome: string;
  texto_devolutiva: string | null;
  texto_geral: string | null;
  desempenho_ah: DesempenhoAH[];
  ah_total_exercicios: number;
  ah_total_erros: number;
  ah_percentual_total: number;
}

export function useFuncionarioDevolutiva(funcionarioId: string, periodo: PeriodoFiltro) {
  const [data, setData] = useState<FuncionarioDevolutivaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFuncionarioDevolutiva = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!funcionarioId) {
          setError('ID do funcionário não fornecido');
          return;
        }

        // Calcular data inicial baseada no período
        const dataFinal = new Date();
        const dataInicial = new Date();
        
        switch (periodo) {
          case 'mes':
            dataInicial.setMonth(dataFinal.getMonth() - 1);
            break;
          case 'trimestre':
            dataInicial.setMonth(dataFinal.getMonth() - 3);
            break;
          case 'quadrimestre':
            dataInicial.setMonth(dataFinal.getMonth() - 4);
            break;
          case 'semestre':
            dataInicial.setMonth(dataFinal.getMonth() - 6);
            break;
          case 'ano':
            dataInicial.setFullYear(dataFinal.getFullYear() - 1);
            break;
        }

        console.log('Buscando devolutiva do funcionário:', funcionarioId);
        console.log('Período:', periodo, 'Data inicial:', dataInicial.toISOString());

        // Usar a função RPC para buscar os dados
        const { data: funcionarioData, error: rpcError } = await supabase
          .rpc('get_funcionario_devolutiva', {
            p_funcionario_id: funcionarioId,
            p_data_inicial: dataInicial.toISOString()
          });

        if (rpcError) {
          console.error('Erro na RPC get_funcionario_devolutiva:', rpcError);
          setError('Erro ao buscar dados do funcionário');
          return;
        }

        if (!funcionarioData) {
          setError('Funcionário não encontrado');
          return;
        }

        console.log('Dados retornados pela RPC:', funcionarioData);

        // Cast do tipo para o formato esperado
        const typedData = funcionarioData as FuncionarioDevolutivaRPCResponse;
        
        // Transformar os dados para o formato esperado
        const desempenhoAH: DesempenhoAH[] = typedData.desempenho_ah || [];
        
        setData({
          id: typedData.id,
          nome: typedData.nome,
          texto_devolutiva: typedData.texto_devolutiva,
          texto_geral: typedData.texto_geral,
          desempenho_ah: desempenhoAH,
          ah_total_exercicios: typedData.ah_total_exercicios || 0,
          ah_total_erros: typedData.ah_total_erros || 0,
          ah_percentual_total: typedData.ah_percentual_total || 0
        });

      } catch (err) {
        console.error('Erro ao buscar devolutiva do funcionário:', err);
        setError('Erro ao carregar dados do funcionário');
      } finally {
        setLoading(false);
      }
    };

    fetchFuncionarioDevolutiva();
  }, [funcionarioId, periodo]);

  return { data, loading, error };
}
