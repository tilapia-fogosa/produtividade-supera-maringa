
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, isAfter } from 'date-fns';
import { useApostilas } from './use-apostilas';

interface AlunoProgresso {
  ultimo_nivel: string | null;
  ultima_pagina: number | null;
  ultima_correcao_ah: string | null;
  total_paginas: number | null;
  paginas_restantes: number | null;
  progresso_percentual: number;
  faltou_mes_atual: boolean | null;
  previsao_conclusao: string | null;
  media_paginas_por_aula: number | null;
  media_exercicios_por_aula: number | null;
}

export const useAlunoProgresso = (alunoId: string) => {
  const [loading, setLoading] = useState(true);
  const [progresso, setProgresso] = useState<AlunoProgresso | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { getTotalPaginas, loading: loadingApostilas } = useApostilas();

  useEffect(() => {
    const fetchProgresso = async () => {
      try {
        if (!alunoId || loadingApostilas) return;
        
        setLoading(true);
        setError(null);

        console.log('useAlunoProgresso: Buscando dados para o aluno ID:', alunoId);

        // Buscar dados do aluno
        const { data: alunoData, error: alunoError } = await supabase
          .from('alunos')
          .select('ultimo_nivel, ultima_pagina, ultima_correcao_ah, ultima_falta')
          .eq('id', alunoId)
          .maybeSingle();

        if (alunoError) {
          console.error('useAlunoProgresso: Erro ao buscar dados do aluno:', alunoError);
          throw alunoError;
        }

        if (!alunoData) {
          console.log('useAlunoProgresso: Nenhum dado encontrado para o aluno ID:', alunoId);
          setProgresso(null);
          return;
        }

        console.log('useAlunoProgresso: Dados do aluno recuperados:', alunoData);

        let totalPaginas = null;
        let paginasRestantes = null;
        let progressoPercentual = 0;
        
        if (alunoData.ultimo_nivel) {
          // Obter total de páginas através do hook useApostilas
          totalPaginas = getTotalPaginas(alunoData.ultimo_nivel);
          console.log(`useAlunoProgresso: Total de páginas para ${alunoData.ultimo_nivel}:`, totalPaginas);
          
          const ultimaPagina = alunoData.ultima_pagina !== null ? Number(alunoData.ultima_pagina) : null;
          
          if (ultimaPagina !== null && totalPaginas !== null) {
            paginasRestantes = Math.max(0, totalPaginas - ultimaPagina);
            progressoPercentual = Math.min(100, (ultimaPagina / totalPaginas) * 100);
            
            console.log('useAlunoProgresso: Cálculos de progresso:', {
              total_paginas: totalPaginas,
              ultima_pagina: ultimaPagina,
              paginas_restantes: paginasRestantes,
              progresso_percentual: progressoPercentual
            });
          }
        }

        const dataAtual = new Date();
        const inicioMesAtual = startOfMonth(dataAtual);
        let faltouMesAtual = null;
        
        if (alunoData.ultima_falta) {
          const dataUltimaFalta = new Date(alunoData.ultima_falta);
          faltouMesAtual = isAfter(dataUltimaFalta, inicioMesAtual);
        }

        const { data: produtividadeData, error: produtividadeError } = await supabase
          .from('produtividade_abaco')
          .select('pagina, exercicios, data_aula')
          .eq('aluno_id', alunoId)
          .eq('presente', true)
          .order('data_aula', { ascending: false })
          .limit(4);

        if (produtividadeError) throw produtividadeError;

        let mediaPaginasPorAula = null;
        let mediaExerciciosPorAula = null;
        let previsaoConclusao = null;

        if (produtividadeData && produtividadeData.length > 0) {
          const registrosComPagina = produtividadeData.filter(p => p.pagina);
          
          if (registrosComPagina.length > 1) {
            const paginasNumeros = registrosComPagina
              .map(p => typeof p.pagina === 'number' ? p.pagina : parseInt(p.pagina, 10))
              .filter(p => !isNaN(p));
            
            if (paginasNumeros.length >= 2) {
              paginasNumeros.sort((a, b) => a - b);
              
              let somaDiferencas = 0;
              for (let i = 1; i < paginasNumeros.length; i++) {
                somaDiferencas += (paginasNumeros[i] - paginasNumeros[i-1]);
              }
              
              mediaPaginasPorAula = somaDiferencas / (paginasNumeros.length - 1);
              
              if (mediaPaginasPorAula > 0 && paginasRestantes !== null) {
                const aulasParaConcluir = Math.ceil(paginasRestantes / mediaPaginasPorAula);
                previsaoConclusao = `Aprox. ${aulasParaConcluir} aulas`;
              }
            }
          }
          
          const exerciciosValidos = produtividadeData
            .filter(p => p.exercicios !== null)
            .map(p => p.exercicios);
            
          if (exerciciosValidos.length > 0) {
            const somaExercicios = exerciciosValidos.reduce((soma, atual) => soma + atual, 0);
            mediaExerciciosPorAula = somaExercicios / exerciciosValidos.length;
          }
        }

        setProgresso({
          ultimo_nivel: alunoData.ultimo_nivel,
          ultima_pagina: alunoData.ultima_pagina,
          ultima_correcao_ah: alunoData.ultima_correcao_ah,
          total_paginas: totalPaginas,
          paginas_restantes: paginasRestantes,
          progresso_percentual: progressoPercentual,
          faltou_mes_atual: faltouMesAtual,
          previsao_conclusao: previsaoConclusao,
          media_paginas_por_aula: mediaPaginasPorAula,
          media_exercicios_por_aula: mediaExerciciosPorAula
        });
      } catch (error) {
        console.error('useAlunoProgresso: Erro ao buscar progresso do aluno:', error);
        setError('Erro ao buscar dados do aluno');
      } finally {
        setLoading(false);
      }
    };

    if (alunoId) {
      fetchProgresso();
    } else {
      setProgresso(null);
      setLoading(false);
    }
  }, [alunoId, getTotalPaginas, loadingApostilas]);

  return { progresso, loading, error };
};
