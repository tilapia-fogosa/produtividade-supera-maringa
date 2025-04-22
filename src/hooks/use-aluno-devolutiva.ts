
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export interface DesempenhoAbacoItem {
  data: string;
  livro: string;
  exercicios: number;
  erros: number;
  percentual_acerto: number;
}

export interface DesempenhoAHItem {
  data: string;
  livro: string;
  exercicios: number;
  erros: number;
  percentual_acerto: number;
}

export interface AlunoDevolutiva {
  id: string;
  nome: string;
  desafios_feitos: number;
  texto_devolutiva: string | null;
  desempenho_abaco: DesempenhoAbacoItem[];
  desempenho_ah: DesempenhoAHItem[];
  abaco_total_exercicios: number;
  abaco_total_erros: number;
  abaco_percentual_total: number;
  ah_total_exercicios: number;
  ah_total_erros: number;
  ah_percentual_total: number;
}

export const useAlunoDevolutiva = (alunoId: string, mes?: string) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AlunoDevolutiva | null>(null);
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

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
          .order('data_aula', { ascending: true });

        if (abacoError) throw abacoError;

        // Buscar dados do AH
        const { data: ahData, error: ahError } = await supabase
          .from('produtividade_ah')
          .select('*')
          .eq('aluno_id', alunoId)
          .order('created_at', { ascending: true });

        if (ahError) throw ahError;

        // Processar dados do Ábaco
        const desempenhoAbaco = abacoData.map(item => ({
          data: item.data_aula,
          livro: item.apostila || '',
          exercicios: item.exercicios || 0,
          erros: item.erros || 0,
          percentual_acerto: item.exercicios ? ((item.exercicios - (item.erros || 0)) / item.exercicios) * 100 : 0
        }));

        // Processar dados do AH
        const desempenhoAH = ahData.map(item => ({
          data: item.created_at,
          livro: item.apostila || '',
          exercicios: item.exercicios || 0,
          erros: item.erros || 0,
          percentual_acerto: item.exercicios ? ((item.exercicios - (item.erros || 0)) / item.exercicios) * 100 : 0
        }));

        // Calcular totais Ábaco
        const abacoTotais = desempenhoAbaco.reduce(
          (acc, curr) => ({
            exercicios: acc.exercicios + curr.exercicios,
            erros: acc.erros + curr.erros
          }),
          { exercicios: 0, erros: 0 }
        );

        // Calcular totais AH
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
          ...abacoData.map(item => item.data_aula.substring(0, 7)),
          ...ahData.map(item => item.created_at.substring(0, 7))
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
  }, [alunoId, mes]);

  return { data, loading, error, mesesDisponiveis };
};
