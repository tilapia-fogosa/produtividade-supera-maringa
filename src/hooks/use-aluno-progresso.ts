import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, isAfter } from 'date-fns';
import { encontrarApostilaMaisProxima } from '@/components/turmas/utils/apostilasUtils';

interface AlunoProgresso {
  ultimo_nivel: string | null;
  ultima_pagina: string | null;
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

  useEffect(() => {
    const fetchProgresso = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: alunoData, error: alunoError } = await supabase
          .from('alunos')
          .select('ultimo_nivel, ultima_pagina, ultima_correcao_ah, ultima_falta')
          .eq('id', alunoId)
          .single();

        if (alunoError) throw alunoError;

        console.log('Dados do aluno:', alunoData);
        console.log('Última página:', alunoData.ultima_pagina, 'Tipo:', typeof alunoData.ultima_pagina);

        let totalPaginas = null;
        let exerciciosPorPagina = null;
        
        if (alunoData.ultimo_nivel) {
          const apostilaNormalizada = encontrarApostilaMaisProxima(alunoData.ultimo_nivel);
          console.log('Nome exato da apostila:', apostilaNormalizada);
          
          const { data: apostilaData, error: apostilaError } = await supabase
            .from('apostilas')
            .select('total_paginas, exercicios_por_pagina')
            .eq('nome', apostilaNormalizada)
            .maybeSingle();

          if (apostilaError) throw apostilaError;
            
          if (apostilaData) {
            console.log('Dados da apostila encontrados:', apostilaData);
            totalPaginas = apostilaData.total_paginas;
            exerciciosPorPagina = apostilaData.exercicios_por_pagina;
            console.log('Total de páginas:', totalPaginas, 'Tipo:', typeof totalPaginas);
          } else {
            console.log('Nenhuma apostila encontrada com o nome exato:', apostilaNormalizada);
          }
        }

        let paginasRestantes = null;
        let progressoPercentual = 0;
        
        if (totalPaginas && alunoData.ultima_pagina) {
          console.log('Calculando páginas restantes...');
          const ultimaPagina = parseInt(alunoData.ultima_pagina, 10);
          console.log('Última página convertida:', ultimaPagina, 'Tipo:', typeof ultimaPagina);
          
          if (!isNaN(ultimaPagina)) {
            paginasRestantes = Math.max(0, totalPaginas - ultimaPagina);
            progressoPercentual = Math.min(100, (ultimaPagina / totalPaginas) * 100);
            console.log('Páginas restantes calculadas:', paginasRestantes);
            console.log('Progresso percentual calculado:', progressoPercentual);
          } else {
            console.log('Erro ao converter última página para número');
          }
        } else {
          console.log('Não foi possível calcular páginas restantes:', {
            temTotalPaginas: !!totalPaginas,
            temUltimaPagina: !!alunoData.ultima_pagina
          });
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
            const paginasNumeros = registrosComPagina.map(p => parseInt(p.pagina, 10)).filter(p => !isNaN(p));
            
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
        console.error('Erro ao buscar progresso do aluno:', error);
        setError('Erro ao buscar dados do aluno');
      } finally {
        setLoading(false);
      }
    };

    if (alunoId) {
      fetchProgresso();
    }
  }, [alunoId]);

  return { progresso, loading, error };
};
