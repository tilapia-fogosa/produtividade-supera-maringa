import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export type PeriodoFiltro = 'mes' | 'trimestre' | 'quadrimestre' | 'semestre' | 'ano';

interface DesempenhoItem {
  mes: string;
  livro: string;
  exercicios: number;
  erros: number;
  percentual_acerto: number;
}

export interface AlunoDevolutivaData {
  id: string;
  nome: string;
  texto_devolutiva: string | null;
  texto_geral: string | null;
  desafios_feitos: number;
  desempenho_abaco: DesempenhoItem[];
  desempenho_ah: DesempenhoItem[];
  abaco_total_exercicios: number;
  abaco_total_erros: number;
  abaco_percentual_total: number;
  ah_total_exercicios: number;
  ah_total_erros: number;
  ah_percentual_total: number;
}

export function useAlunoDevolutiva(alunoId: string, periodo: PeriodoFiltro) {
  const [data, setData] = useState<AlunoDevolutivaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!alunoId) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchDevolutiva = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('=== INICIANDO BUSCA DE DEVOLUTIVA (BUSCA POR NOME) ===');
        console.log('Aluno ID:', alunoId);
        console.log('Período:', periodo);

        // Primeiro, buscar dados do aluno
        const { data: alunoData, error: alunoError } = await supabase
          .from('alunos')
          .select('id, nome, texto_devolutiva')
          .eq('id', alunoId)
          .single();

        if (alunoError) {
          console.error('Erro ao buscar dados do aluno:', alunoError);
          throw new Error('Aluno não encontrado');
        }

        if (!alunoData) {
          throw new Error('Aluno não encontrado');
        }

        console.log('✓ Dados do aluno encontrados:', alunoData);
        const nomeAluno = alunoData.nome;

        // Buscar texto geral das devolutivas
        const { data: configData } = await supabase
          .from('devolutivas_config')
          .select('texto_geral')
          .limit(1)
          .single();

        console.log('✓ Configuração de devolutiva:', configData);

        // Calcular data inicial baseada no período
        const dataFinal = new Date();
        const dataInicial = new Date();
        
        switch (periodo) {
          case 'mes':
            dataInicial.setMonth(dataInicial.getMonth() - 1);
            break;
          case 'trimestre':
            dataInicial.setMonth(dataInicial.getMonth() - 3);
            break;
          case 'quadrimestre':
            dataInicial.setMonth(dataInicial.getMonth() - 4);
            break;
          case 'semestre':
            dataInicial.setMonth(dataInicial.getMonth() - 6);
            break;
          case 'ano':
            dataInicial.setFullYear(dataInicial.getFullYear() - 1);
            break;
        }

        const dataInicialFormatada = dataInicial.toISOString().split('T')[0];
        const dataFinalFormatada = dataFinal.toISOString().split('T')[0];
        
        console.log('✓ Período de busca:', dataInicialFormatada, 'até', dataFinalFormatada);
        console.log('✓ Nome do aluno para busca:', nomeAluno);

        // Buscar produtividade ábaco usando nome do aluno
        console.log('=== BUSCANDO PRODUTIVIDADE ÁBACO ===');
        
        const { data: produtividadeAbaco, error: abacoError } = await supabase
          .from('produtividade_abaco')
          .select('*')
          .eq('aluno_nome', nomeAluno)
          .gte('data_aula', dataInicialFormatada)
          .lte('data_aula', dataFinalFormatada)
          .eq('presente', true)
          .order('data_aula', { ascending: false });

        if (abacoError) {
          console.error('Erro ao buscar produtividade ábaco:', abacoError);
        } else {
          console.log('✓ Produtividade ábaco encontrada:', produtividadeAbaco?.length || 0, 'registros');
          if (produtividadeAbaco && produtividadeAbaco.length > 0) {
            console.log('Primeiros registros do período:', produtividadeAbaco.slice(0, 2));
          }
        }

        // Buscar produtividade AH usando nome do aluno
        console.log('=== BUSCANDO PRODUTIVIDADE AH POR NOME ===');
        
        const { data: produtividadeAH, error: ahError } = await supabase
          .from('produtividade_ah')
          .select('*')
          .eq('aluno_nome', nomeAluno)
          .gte('created_at', dataInicial.toISOString())
          .lte('created_at', dataFinal.toISOString())
          .order('created_at', { ascending: false });

        if (ahError) {
          console.error('Erro ao buscar produtividade AH:', ahError);
        } else {
          console.log('✓ Produtividade AH encontrada:', produtividadeAH?.length || 0, 'registros');
          if (produtividadeAH && produtividadeAH.length > 0) {
            console.log('Primeiros registros do período:', produtividadeAH.slice(0, 2));
          }
        }

        // Processar dados ábaco por mês
        const abacoProcessado = processarDadosPorMes(produtividadeAbaco || [], 'data_aula');
        const ahProcessado = processarDadosPorMes(produtividadeAH || [], 'created_at');

        console.log('✓ Dados ábaco processados:', abacoProcessado.length, 'meses');
        console.log('✓ Dados AH processados:', ahProcessado.length, 'meses');

        // Calcular totais
        const abacoTotais = calcularTotais(abacoProcessado);
        const ahTotais = calcularTotais(ahProcessado);

        // Contar desafios feitos
        const desafiosFeitos = (produtividadeAbaco || []).filter(p => p.fez_desafio).length;

        const resultado: AlunoDevolutivaData = {
          id: alunoData.id,
          nome: alunoData.nome,
          texto_devolutiva: alunoData.texto_devolutiva,
          texto_geral: configData?.texto_geral || null,
          desafios_feitos: desafiosFeitos,
          desempenho_abaco: abacoProcessado,
          desempenho_ah: ahProcessado,
          abaco_total_exercicios: abacoTotais.exercicios,
          abaco_total_erros: abacoTotais.erros,
          abaco_percentual_total: abacoTotais.percentual,
          ah_total_exercicios: ahTotais.exercicios,
          ah_total_erros: ahTotais.erros,
          ah_percentual_total: ahTotais.percentual,
        };

        console.log('=== RESULTADO FINAL ===');
        console.log('Nome:', resultado.nome);
        console.log('Desafios feitos:', resultado.desafios_feitos);
        console.log('Meses com dados ábaco:', resultado.desempenho_abaco.length);
        console.log('Meses com dados AH:', resultado.desempenho_ah.length);
        console.log('Total exercícios ábaco:', resultado.abaco_total_exercicios);
        console.log('Total exercícios AH:', resultado.ah_total_exercicios);

        setData(resultado);

      } catch (err) {
        console.error('=== ERRO NA BUSCA ===');
        console.error('Erro:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados da devolutiva');
      } finally {
        setLoading(false);
      }
    };

    fetchDevolutiva();
  }, [alunoId, periodo]);

  return { data, loading, error };
}

function processarDadosPorMes(dados: any[], campoData: string): DesempenhoItem[] {
  console.log('Processando dados por mês:', dados.length, 'registros');
  
  const dadosPorMes = new Map<string, {
    livros: Set<string>;
    exercicios: number;
    erros: number;
  }>();

  dados.forEach((item, index) => {
    console.log(`Processando item ${index + 1}:`, item);
    
    const data = new Date(item[campoData]);
    const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
    
    if (!dadosPorMes.has(mesAno)) {
      dadosPorMes.set(mesAno, {
        livros: new Set(),
        exercicios: 0,
        erros: 0
      });
    }

    const mesData = dadosPorMes.get(mesAno)!;
    
    if (item.apostila) {
      mesData.livros.add(item.apostila);
    }
    
    mesData.exercicios += item.exercicios || 0;
    mesData.erros += item.erros || 0;
  });

  const resultado = Array.from(dadosPorMes.entries()).map(([mes, dados]) => ({
    mes,
    livro: Array.from(dados.livros).join(', ') || 'Não informado',
    exercicios: dados.exercicios,
    erros: dados.erros,
    percentual_acerto: dados.exercicios > 0 
      ? ((dados.exercicios - dados.erros) / dados.exercicios) * 100 
      : 0
  })).sort((a, b) => {
    const [mesA, anoA] = a.mes.split('/').map(Number);
    const [mesB, anoB] = b.mes.split('/').map(Number);
    
    if (anoA !== anoB) return anoB - anoA;
    return mesB - mesA;
  });

  console.log('Resultado processado:', resultado);
  return resultado;
}

function calcularTotais(dados: DesempenhoItem[]) {
  const exercicios = dados.reduce((sum, item) => sum + item.exercicios, 0);
  const erros = dados.reduce((sum, item) => sum + item.erros, 0);
  const percentual = exercicios > 0 ? ((exercicios - erros) / exercicios) * 100 : 0;

  return { exercicios, erros, percentual };
}
