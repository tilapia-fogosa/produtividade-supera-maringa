
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DesempenhoMensalItem {
  mes: string;
  livro: string;
  exercicios: number;
  erros: number;
  percentual_acerto: number;
}

export interface DesempenhoMensalAH extends DesempenhoMensalItem {}
export interface DesempenhoMensalAbaco extends DesempenhoMensalItem {}

export type PeriodoFiltro = 'mes' | 'trimestre' | 'quadrimestre' | 'semestre' | 'ano';

export interface AlunoDevolutiva {
  id: string;
  nome: string;
  desafios_feitos: number;
  texto_devolutiva: string | null;
  texto_geral: string | null;
  desempenho_abaco: DesempenhoMensalAbaco[];
  desempenho_ah: DesempenhoMensalAH[];
  abaco_total_exercicios: number;
  abaco_total_erros: number;
  abaco_percentual_total: number;
  ah_total_exercicios: number;
  ah_total_erros: number;
  ah_percentual_total: number;
}

export const useAlunoDevolutiva = (alunoId: string, periodo: PeriodoFiltro = 'mes') => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AlunoDevolutiva | null>(null);
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Primeiro, obter a data inicial com base no período selecionado
        const { data: dataInicial, error: dataInicialError } = await supabase
          .rpc('get_periodo_data', { p_periodo: periodo });

        if (dataInicialError) {
          console.error('Erro ao calcular data inicial:', dataInicialError);
          throw new Error('Erro ao calcular período de datas');
        }

        // Agora chamar a função principal para obter todos os dados de desempenho
        const { data: devolutivaData, error: devolutivaError } = await supabase
          .rpc('get_aluno_desempenho', {
            p_aluno_id: alunoId,
            p_data_inicial: dataInicial,
          });

        if (devolutivaError) {
          console.error('Erro ao buscar dados da devolutiva:', devolutivaError);
          throw devolutivaError;
        }

        if (!devolutivaData) {
          throw new Error('Nenhum dado encontrado para o aluno');
        }

        // Utilizando type assertion para dizer ao TypeScript que devolutivaData é do tipo AlunoDevolutiva
        const tipoDevolutivaData = devolutivaData as unknown as Record<string, any>;
        
        // Definir os meses disponíveis
        if (tipoDevolutivaData.meses_disponiveis) {
          setMesesDisponiveis(tipoDevolutivaData.meses_disponiveis || []);
        }

        // Processar os dados retornados
        const alunoDevolutiva: AlunoDevolutiva = {
          id: tipoDevolutivaData.id,
          nome: tipoDevolutivaData.nome,
          texto_devolutiva: tipoDevolutivaData.texto_devolutiva,
          texto_geral: tipoDevolutivaData.texto_geral,
          desafios_feitos: tipoDevolutivaData.desafios_feitos || 0,
          desempenho_abaco: tipoDevolutivaData.desempenho_abaco || [],
          desempenho_ah: tipoDevolutivaData.desempenho_ah || [],
          abaco_total_exercicios: tipoDevolutivaData.abaco_total_exercicios || 0,
          abaco_total_erros: tipoDevolutivaData.abaco_total_erros || 0,
          abaco_percentual_total: tipoDevolutivaData.abaco_percentual_total || 0,
          ah_total_exercicios: tipoDevolutivaData.ah_total_exercicios || 0,
          ah_total_erros: tipoDevolutivaData.ah_total_erros || 0,
          ah_percentual_total: tipoDevolutivaData.ah_percentual_total || 0,
        };

        setData(alunoDevolutiva);

      } catch (err) {
        console.error('Erro ao buscar dados da devolutiva:', err);
        setError('Erro ao carregar dados do aluno');
      } finally {
        setLoading(false);
      }
    };

    if (alunoId) {
      fetchData();
    }
  }, [alunoId, periodo]);

  return { data, loading, error, mesesDisponiveis };
};
