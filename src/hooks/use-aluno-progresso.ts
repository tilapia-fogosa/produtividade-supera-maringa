
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, isAfter } from 'date-fns';

interface AlunoProgresso {
  ultimo_nivel: string | null;
  ultima_pagina: string | null;
  ultima_correcao_ah: string | null;
  apostila_atual: string | null;
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

        // Buscar dados do aluno
        const { data: alunoData, error: alunoError } = await supabase
          .from('alunos')
          .select('ultimo_nivel, ultima_pagina, ultima_correcao_ah, apostila_atual, ultima_falta')
          .eq('id', alunoId)
          .single();

        if (alunoError) throw alunoError;

        // Definir a apostila atual como ultimo_nivel se apostila_atual estiver vazio
        const apostilaAtual = alunoData.apostila_atual || alunoData.ultimo_nivel;

        let totalPaginas = null;
        let exerciciosPorPagina = null;
        
        // Buscar total de páginas da apostila atual
        if (apostilaAtual) {
          const { data: apostilaData, error: apostilaError } = await supabase
            .from('apostilas')
            .select('total_paginas, exercicios_por_pagina')
            .eq('nome', apostilaAtual)
            .maybeSingle();

          if (apostilaError) throw apostilaError;
          
          if (apostilaData) {
            totalPaginas = apostilaData.total_paginas;
            exerciciosPorPagina = apostilaData.exercicios_por_pagina;
          }
        }

        // Calcular páginas restantes
        let paginasRestantes = null;
        let progressoPercentual = 0;
        
        if (totalPaginas && alunoData.ultima_pagina) {
          const ultimaPagina = parseInt(alunoData.ultima_pagina, 10);
          if (!isNaN(ultimaPagina)) {
            paginasRestantes = Math.max(0, totalPaginas - ultimaPagina);
            progressoPercentual = Math.min(100, (ultimaPagina / totalPaginas) * 100);
          }
        }

        // Verificar se o aluno faltou no mês atual
        const dataAtual = new Date();
        const inicioMesAtual = startOfMonth(dataAtual);
        let faltouMesAtual = null;
        
        if (alunoData.ultima_falta) {
          const dataUltimaFalta = new Date(alunoData.ultima_falta);
          faltouMesAtual = isAfter(dataUltimaFalta, inicioMesAtual);
        }

        // Buscar histórico de produtividade para calcular médias
        const { data: produtividadeData, error: produtividadeError } = await supabase
          .from('produtividade_abaco')
          .select('pagina, exercicios, data_aula')
          .eq('aluno_id', alunoId)
          .eq('presente', true)
          .order('data_aula', { ascending: false })
          .limit(4);

        if (produtividadeError) throw produtividadeError;

        // Calcular médias de produtividade
        let mediaPaginasPorAula = null;
        let mediaExerciciosPorAula = null;
        let previsaoConclusao = null;

        if (produtividadeData && produtividadeData.length > 0) {
          // Filtrar registros sem pagina
          const registrosComPagina = produtividadeData.filter(p => p.pagina);
          
          if (registrosComPagina.length > 1) {
            // Calcular páginas completadas por aula
            const paginasNumeros = registrosComPagina.map(p => parseInt(p.pagina, 10)).filter(p => !isNaN(p));
            
            if (paginasNumeros.length >= 2) {
              // Ordenar em ordem crescente para calcular a diferença
              paginasNumeros.sort((a, b) => a - b);
              
              // Calcular a média de páginas por aula
              let somaDiferencas = 0;
              for (let i = 1; i < paginasNumeros.length; i++) {
                somaDiferencas += (paginasNumeros[i] - paginasNumeros[i-1]);
              }
              
              mediaPaginasPorAula = somaDiferencas / (paginasNumeros.length - 1);
              
              // Calcular previsão de conclusão
              if (mediaPaginasPorAula > 0 && paginasRestantes !== null) {
                const aulasParaConcluir = Math.ceil(paginasRestantes / mediaPaginasPorAula);
                previsaoConclusao = `Aprox. ${aulasParaConcluir} aulas`;
              }
            }
          }
          
          // Calcular média de exercícios por aula
          const exerciciosValidos = produtividadeData
            .filter(p => p.exercicios !== null)
            .map(p => p.exercicios);
            
          if (exerciciosValidos.length > 0) {
            const somaExercicios = exerciciosValidos.reduce((soma, atual) => soma + atual, 0);
            mediaExerciciosPorAula = somaExercicios / exerciciosValidos.length;
          }
        }

        setProgresso({
          ...alunoData,
          apostila_atual: apostilaAtual,
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
