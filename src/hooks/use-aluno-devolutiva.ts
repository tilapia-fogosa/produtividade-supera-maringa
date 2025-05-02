
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
      if (!alunoId) return;
      
      try {
        setLoading(true);
        setError(null);

        console.log(`Buscando dados para o aluno ID: ${alunoId}, período: ${periodo}`);

        // Primeiro, obter a data inicial com base no período selecionado
        const { data: dataInicial, error: dataInicialError } = await supabase
          .rpc('get_periodo_data', { p_periodo: periodo });

        if (dataInicialError) {
          console.error('Erro ao calcular data inicial:', dataInicialError);
          throw new Error('Erro ao calcular período de datas');
        }

        // Em vez de usar a função RPC complexa, vamos buscar os dados manualmente
        // para ter mais controle sobre o processo

        // 1. Buscar informações básicas do aluno
        const { data: dadosAluno, error: alunoError } = await supabase
          .from('alunos')
          .select('id, nome, texto_devolutiva')
          .eq('id', alunoId)
          .single();

        if (alunoError) {
          console.error('Erro ao buscar dados do aluno:', alunoError);
          throw alunoError;
        }

        // 2. Buscar texto geral da devolutiva
        const { data: configDevolutiva, error: configError } = await supabase
          .from('devolutivas_config')
          .select('texto_geral')
          .single();

        const textoGeral = configError ? null : configDevolutiva?.texto_geral;

        // 3. Buscar dados de ábaco
        const { data: dadosAbaco, error: abacoError } = await supabase
          .from('produtividade_abaco')
          .select('data_aula, apostila, exercicios, erros, fez_desafio')
          .eq('aluno_id', alunoId)
          .gte('data_aula', dataInicial)
          .order('data_aula', { ascending: false });

        if (abacoError) {
          console.error('Erro ao buscar dados de ábaco:', abacoError);
        }

        // 4. Buscar dados de AH
        const { data: dadosAH, error: ahError } = await supabase
          .from('produtividade_ah')
          .select('created_at, apostila, exercicios, erros')
          .eq('aluno_id', alunoId)
          .gte('created_at', dataInicial)
          .order('created_at', { ascending: false });

        if (ahError) {
          console.error('Erro ao buscar dados de AH:', ahError);
        }

        // Processar os dados de ábaco agrupando por mês
        const abacoMensal: Record<string, DesempenhoMensalAbaco> = {};
        let totalDesafios = 0;
        let totalExerciciosAbaco = 0;
        let totalErrosAbaco = 0;

        (dadosAbaco || []).forEach(item => {
          if (!item.data_aula) return;
          
          const mesKey = format(new Date(item.data_aula), 'yyyy-MM');
          const mesFormatado = format(new Date(item.data_aula), 'MMMM yyyy', { locale: ptBR });
          
          if (!abacoMensal[mesKey]) {
            abacoMensal[mesKey] = {
              mes: mesFormatado,
              livro: item.apostila || '',
              exercicios: 0,
              erros: 0,
              percentual_acerto: 0
            };
          }
          
          // Adicionar apostila se ainda não estiver na string
          if (item.apostila && !abacoMensal[mesKey].livro.includes(item.apostila)) {
            abacoMensal[mesKey].livro = abacoMensal[mesKey].livro 
              ? `${abacoMensal[mesKey].livro}, ${item.apostila}` 
              : item.apostila;
          }
          
          // Somar exercícios e erros
          abacoMensal[mesKey].exercicios += item.exercicios || 0;
          abacoMensal[mesKey].erros += item.erros || 0;
          
          // Contabilizar totais gerais
          totalExerciciosAbaco += item.exercicios || 0;
          totalErrosAbaco += item.erros || 0;
          
          // Contar desafios
          if (item.fez_desafio) {
            totalDesafios++;
          }
        });

        // Calcular percentuais de acerto para ábaco
        Object.values(abacoMensal).forEach(mes => {
          if (mes.exercicios > 0) {
            mes.percentual_acerto = ((mes.exercicios - mes.erros) / mes.exercicios) * 100;
          }
        });

        // Processar os dados de AH agrupando por mês
        const ahMensal: Record<string, DesempenhoMensalAH> = {};
        let totalExerciciosAH = 0;
        let totalErrosAH = 0;

        (dadosAH || []).forEach(item => {
          if (!item.created_at) return;
          
          const mesKey = format(new Date(item.created_at), 'yyyy-MM');
          const mesFormatado = format(new Date(item.created_at), 'MMMM yyyy', { locale: ptBR });
          
          if (!ahMensal[mesKey]) {
            ahMensal[mesKey] = {
              mes: mesFormatado,
              livro: item.apostila || '',
              exercicios: 0,
              erros: 0,
              percentual_acerto: 0
            };
          }
          
          // Adicionar apostila se ainda não estiver na string
          if (item.apostila && !ahMensal[mesKey].livro.includes(item.apostila)) {
            ahMensal[mesKey].livro = ahMensal[mesKey].livro 
              ? `${ahMensal[mesKey].livro}, ${item.apostila}` 
              : item.apostila;
          }
          
          // Somar exercícios e erros
          ahMensal[mesKey].exercicios += item.exercicios || 0;
          ahMensal[mesKey].erros += item.erros || 0;
          
          // Contabilizar totais gerais
          totalExerciciosAH += item.exercicios || 0;
          totalErrosAH += item.erros || 0;
        });

        // Calcular percentuais de acerto para AH
        Object.values(ahMensal).forEach(mes => {
          if (mes.exercicios > 0) {
            mes.percentual_acerto = ((mes.exercicios - mes.erros) / mes.exercicios) * 100;
          }
        });

        // Calcular percentuais totais
        const abacoPercentualTotal = totalExerciciosAbaco > 0
          ? ((totalExerciciosAbaco - totalErrosAbaco) / totalExerciciosAbaco) * 100
          : 0;
          
        const ahPercentualTotal = totalExerciciosAH > 0
          ? ((totalExerciciosAH - totalErrosAH) / totalExerciciosAH) * 100
          : 0;

        // Recolher todos os meses disponíveis (combinando ábaco e AH)
        const todosMeses = new Set([
          ...Object.keys(abacoMensal),
          ...Object.keys(ahMensal)
        ].sort());
        
        setMesesDisponiveis(Array.from(todosMeses));

        // Montar o objeto final da devolutiva
        const alunoDevolutiva: AlunoDevolutiva = {
          id: dadosAluno.id,
          nome: dadosAluno.nome,
          texto_devolutiva: dadosAluno.texto_devolutiva,
          texto_geral: textoGeral,
          desafios_feitos: totalDesafios,
          desempenho_abaco: Object.values(abacoMensal),
          desempenho_ah: Object.values(ahMensal),
          abaco_total_exercicios: totalExerciciosAbaco,
          abaco_total_erros: totalErrosAbaco,
          abaco_percentual_total: abacoPercentualTotal,
          ah_total_exercicios: totalExerciciosAH,
          ah_total_erros: totalErrosAH,
          ah_percentual_total: ahPercentualTotal,
        };

        setData(alunoDevolutiva);
        console.log("Dados processados com sucesso:", alunoDevolutiva);

      } catch (err) {
        console.error('Erro ao buscar dados da devolutiva:', err);
        setError('Erro ao carregar dados do aluno. Por favor, tente novamente mais tarde.');
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
