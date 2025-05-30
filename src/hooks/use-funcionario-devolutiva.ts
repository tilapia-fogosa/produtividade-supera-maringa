
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

        // Buscar dados do funcionário
        const { data: funcionarioData, error: funcionarioError } = await supabase
          .from('funcionarios')
          .select('id, nome, texto_devolutiva')
          .eq('id', funcionarioId)
          .single();

        if (funcionarioError) {
          console.error('Erro ao buscar funcionário:', funcionarioError);
          setError('Funcionário não encontrado');
          return;
        }

        // Buscar dados de produtividade AH do funcionário
        const { data: ahData, error: ahError } = await supabase
          .from('produtividade_ah_funcionarios')
          .select('apostila, exercicios, erros, created_at')
          .eq('funcionario_id', funcionarioId)
          .gte('created_at', dataInicial.toISOString())
          .lte('created_at', dataFinal.toISOString())
          .order('created_at', { ascending: false });

        if (ahError) {
          console.error('Erro ao buscar produtividade AH:', ahError);
        }

        // Buscar texto geral da configuração
        const { data: configData } = await supabase
          .from('devolutivas_config')
          .select('texto_geral')
          .limit(1);

        // Processar dados de AH por mês
        const ahPorMes = new Map<string, {
          livros: Set<string>;
          exercicios: number;
          erros: number;
        }>();

        (ahData || []).forEach(item => {
          const mes = new Date(item.created_at).toLocaleDateString('pt-BR', { 
            month: 'long', 
            year: 'numeric' 
          });
          
          if (!ahPorMes.has(mes)) {
            ahPorMes.set(mes, {
              livros: new Set(),
              exercicios: 0,
              erros: 0
            });
          }
          
          const mesData = ahPorMes.get(mes)!;
          if (item.apostila) mesData.livros.add(item.apostila);
          mesData.exercicios += item.exercicios || 0;
          mesData.erros += item.erros || 0;
        });

        // Converter para array e calcular percentuais
        const desempenhoAH: DesempenhoAH[] = Array.from(ahPorMes.entries()).map(([mes, dados]) => ({
          mes,
          livro: Array.from(dados.livros).join(', ') || 'Não registrado',
          exercicios: dados.exercicios,
          erros: dados.erros,
          percentual_acerto: dados.exercicios > 0 
            ? ((dados.exercicios - dados.erros) / dados.exercicios) * 100 
            : 0
        }));

        // Calcular totais
        const ahTotalExercicios = desempenhoAH.reduce((sum, item) => sum + item.exercicios, 0);
        const ahTotalErros = desempenhoAH.reduce((sum, item) => sum + item.erros, 0);
        const ahPercentualTotal = ahTotalExercicios > 0 
          ? ((ahTotalExercicios - ahTotalErros) / ahTotalExercicios) * 100 
          : 0;

        setData({
          id: funcionarioData.id,
          nome: funcionarioData.nome,
          texto_devolutiva: funcionarioData.texto_devolutiva,
          texto_geral: configData?.[0]?.texto_geral || null,
          desempenho_ah: desempenhoAH,
          ah_total_exercicios: ahTotalExercicios,
          ah_total_erros: ahTotalErros,
          ah_percentual_total: ahPercentualTotal
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
