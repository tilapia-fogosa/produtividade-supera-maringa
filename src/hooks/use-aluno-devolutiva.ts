
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { subMonths, format, parseISO, isWithinInterval } from 'date-fns';
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
  desempenho_abaco: DesempenhoMensalAbaco[];
  desempenho_ah: DesempenhoMensalAH[];
  abaco_total_exercicios: number;
  abaco_total_erros: number;
  abaco_percentual_total: number;
  ah_total_exercicios: number;
  ah_total_erros: number;
  ah_percentual_total: number;
}

interface AgrupamentoMensal {
  [key: string]: {
    exercicios: number;
    erros: number;
    livros: Set<string>;
  };
}

export const useAlunoDevolutiva = (alunoId: string, periodo: PeriodoFiltro = 'mes') => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AlunoDevolutiva | null>(null);
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([]);

  const getPeriodoData = (periodo: PeriodoFiltro) => {
    const hoje = new Date();
    const mesesAnteriores = {
      mes: 1,
      trimestre: 3,
      quadrimestre: 4,
      semestre: 6,
      ano: 12
    };
    return subMonths(hoje, mesesAnteriores[periodo]);
  };

  const agruparPorMes = (dados: any[], dataField: string): DesempenhoMensalItem[] => {
    const agrupamento: AgrupamentoMensal = {};
    
    dados.forEach(item => {
      const data = typeof item[dataField] === 'string' ? parseISO(item[dataField]) : item[dataField];
      const mesKey = format(data, 'yyyy-MM');
      
      if (!agrupamento[mesKey]) {
        agrupamento[mesKey] = {
          exercicios: 0,
          erros: 0,
          livros: new Set()
        };
      }
      
      agrupamento[mesKey].exercicios += item.exercicios || 0;
      agrupamento[mesKey].erros += item.erros || 0;
      if (item.apostila) agrupamento[mesKey].livros.add(item.apostila);
    });

    return Object.entries(agrupamento).map(([mesKey, dados]) => ({
      mes: format(parseISO(mesKey + '-01'), 'MMMM yyyy', { locale: ptBR }),
      livro: Array.from(dados.livros).join(', '),
      exercicios: dados.exercicios,
      erros: dados.erros,
      percentual_acerto: dados.exercicios > 0 ? ((dados.exercicios - dados.erros) / dados.exercicios) * 100 : 0
    })).sort((a, b) => {
      const mesA = parseISO(a.mes.split(' ')[0] + '-01-' + a.mes.split(' ')[1]);
      const mesB = parseISO(b.mes.split(' ')[0] + '-01-' + b.mes.split(' ')[1]);
      return mesB.getTime() - mesA.getTime();
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const dataInicial = getPeriodoData(periodo);

        // Buscar dados básicos do aluno
        const { data: alunoData, error: alunoError } = await supabase
          .from('alunos')
          .select('id, nome, texto_devolutiva')
          .eq('id', alunoId)
          .single();

        if (alunoError) throw alunoError;

        // Buscar dados do Ábaco
        const { data: abacoData, error: abacoError } = await supabase
          .from('produtividade_abaco')
          .select('*')
          .eq('aluno_id', alunoId)
          .gte('data_aula', dataInicial.toISOString())
          .order('data_aula', { ascending: true });

        if (abacoError) throw abacoError;

        // Buscar dados do AH
        const { data: ahData, error: ahError } = await supabase
          .from('produtividade_ah')
          .select('*')
          .eq('aluno_id', alunoId)
          .gte('created_at', dataInicial.toISOString())
          .order('created_at', { ascending: true });

        if (ahError) throw ahError;

        // Processar dados por mês
        const desempenhoAbaco = agruparPorMes(abacoData, 'data_aula');
        const desempenhoAH = agruparPorMes(ahData, 'created_at');

        // Calcular totais gerais
        const abacoTotais = desempenhoAbaco.reduce(
          (acc, curr) => ({
            exercicios: acc.exercicios + curr.exercicios,
            erros: acc.erros + curr.erros
          }),
          { exercicios: 0, erros: 0 }
        );

        const ahTotais = desempenhoAH.reduce(
          (acc, curr) => ({
            exercicios: acc.exercicios + curr.exercicios,
            erros: acc.erros + curr.erros
          }),
          { exercicios: 0, erros: 0 }
        );

        // Montar objeto final
        setData({
          id: alunoId,
          nome: alunoData.nome,
          desafios_feitos: abacoData.filter(item => item.fez_desafio).length,
          texto_devolutiva: alunoData.texto_devolutiva,
          desempenho_abaco: desempenhoAbaco,
          desempenho_ah: desempenhoAH,
          abaco_total_exercicios: abacoTotais.exercicios,
          abaco_total_erros: abacoTotais.erros,
          abaco_percentual_total: abacoTotais.exercicios 
            ? ((abacoTotais.exercicios - abacoTotais.erros) / abacoTotais.exercicios) * 100 
            : 0,
          ah_total_exercicios: ahTotais.exercicios,
          ah_total_erros: ahTotais.erros,
          ah_percentual_total: ahTotais.exercicios 
            ? ((ahTotais.exercicios - ahTotais.erros) / ahTotais.exercicios) * 100 
            : 0
        });

        // Coletar meses disponíveis
        const meses = [...new Set([
          ...abacoData.map(item => format(new Date(item.data_aula), 'yyyy-MM')),
          ...ahData.map(item => format(new Date(item.created_at), 'yyyy-MM'))
        ])].sort();
        
        setMesesDisponiveis(meses);

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
