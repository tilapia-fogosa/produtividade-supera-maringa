import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export type PeriodoFiltro = 'mes_atual' | 'mes_passado' | 'trimestre' | 'quadrimestre' | 'semestre' | 'ano';

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
        console.log('=== INICIANDO BUSCA DE DEVOLUTIVA COM RPC ===');
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

        // Buscar texto geral das devolutivas
        const { data: configData } = await supabase
          .from('devolutivas_config')
          .select('texto_geral')
          .limit(1)
          .single();

        console.log('✓ Configuração de devolutiva:', configData);

        // Calcular período
        const hoje = new Date();
        let dataInicial: Date;
        
        // CORREÇÃO: Sempre incluir o mês atual nos períodos
        switch (periodo) {
          case 'mes_atual':
            dataInicial = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            break;
          case 'mes_passado':
            dataInicial = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
            break;
          case 'trimestre':
            // Últimos 3 meses incluindo o atual
            dataInicial = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
            break;
          case 'quadrimestre':
            // Últimos 4 meses incluindo o atual
            dataInicial = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1);
            break;
          case 'semestre':
            // Últimos 6 meses incluindo o atual
            dataInicial = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
            break;
          case 'ano':
            // Últimos 12 meses incluindo o atual
            dataInicial = new Date(hoje.getFullYear() - 1, hoje.getMonth() + 1, 1);
            break;
          default:
            dataInicial = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        }

        // Data final é sempre o dia atual
        const dataFinal = hoje;

        const dataInicialFormatada = dataInicial.toISOString().split('T')[0];
        const dataFinalFormatada = dataFinal.toISOString().split('T')[0];
        
        console.log('✓ Período de busca:', dataInicialFormatada, 'até', dataFinalFormatada);

        // Usar a nova função RPC para buscar dados do ábaco sem duplicatas
        console.log('=== BUSCANDO DADOS DO ÁBACO VIA RPC (SEM DUPLICATAS) ===');
        
        const { data: produtividadeAbaco, error: abacoError } = await supabase
          .rpc('get_produtividade_abaco_limpa', {
            p_pessoa_id: alunoId,
            p_data_inicial: dataInicialFormatada,
            p_data_final: dataFinalFormatada
          });

        if (abacoError) {
          console.error('Erro ao buscar dados do ábaco via RPC:', abacoError);
          throw new Error('Erro ao buscar dados de produtividade do ábaco');
        }

        console.log('Dados ábaco via RPC (sem duplicatas):', produtividadeAbaco?.length || 0, 'registros');
        if (produtividadeAbaco && produtividadeAbaco.length > 0) {
          console.log('Primeiros registros ábaco:', produtividadeAbaco.slice(0, 2));
          console.log('Total exercícios bruto:', produtividadeAbaco.reduce((sum: number, item: any) => sum + (item.exercicios || 0), 0));
        }

        // NOVA CONSULTA SEPARADA PARA DESAFIOS - incluindo todos os registros, mesmo com exercicios = 0
        console.log('=== BUSCANDO DESAFIOS SEPARADAMENTE ===');
        
        const { data: desafiosData, error: desafiosError } = await supabase
          .from('produtividade_abaco')
          .select('data_aula, fez_desafio')
          .eq('pessoa_id', alunoId)
          .eq('tipo_pessoa', 'aluno')
          .eq('fez_desafio', true)
          .gte('data_aula', dataInicialFormatada)
          .lte('data_aula', dataFinalFormatada)
          .order('data_aula', { ascending: false });

        if (desafiosError) {
          console.error('Erro ao buscar desafios:', desafiosError);
        }

        // Remover duplicatas de desafios por data
        const desafiosUnicos = new Map();
        (desafiosData || []).forEach(item => {
          const data = item.data_aula;
          if (!desafiosUnicos.has(data)) {
            desafiosUnicos.set(data, item);
          }
        });

        const totalDesafios = desafiosUnicos.size;
        console.log('✓ Total de desafios únicos encontrados:', totalDesafios);
        console.log('✓ Datas dos desafios:', Array.from(desafiosUnicos.keys()));

        // Buscar dados do AH (ainda sem RPC, mas usando filtro manual por enquanto)
        const { data: produtividadeAHRaw, error: ahError } = await supabase
          .from('produtividade_ah')
          .select('*')
          .eq('pessoa_id', alunoId)
          .eq('tipo_pessoa', 'aluno')
          .order('created_at', { ascending: false });

        let produtividadeAH: any[] = [];
        if (produtividadeAHRaw && !ahError) {
          produtividadeAH = produtividadeAHRaw.filter(item => {
            const dataItem = new Date(item.created_at).toISOString().split('T')[0];
            return dataItem >= dataInicialFormatada && dataItem <= dataFinalFormatada;
          });
        }

        console.log('Dados AH no período:', produtividadeAH.length, 'registros');

        // Processar dados - agora os dados do ábaco já vêm limpos da RPC
        const abacoProcessado = processarDadosAbacoePorMes(produtividadeAbaco || []);
        const ahProcessado = processarDadosAHPorMes(produtividadeAH || []);

        console.log('✓ Dados ábaco processados (pós-RPC):', abacoProcessado);
        console.log('✓ Dados AH processados:', ahProcessado);

        // Calcular totais
        const abacoTotais = calcularTotais(abacoProcessado);
        const ahTotais = calcularTotais(ahProcessado);

        const resultado: AlunoDevolutivaData = {
          id: alunoData.id,
          nome: alunoData.nome,
          texto_devolutiva: alunoData.texto_devolutiva,
          texto_geral: configData?.texto_geral || null,
          desafios_feitos: totalDesafios, // Usando a contagem separada de desafios
          desempenho_abaco: abacoProcessado,
          desempenho_ah: ahProcessado,
          abaco_total_exercicios: abacoTotais.exercicios,
          abaco_total_erros: abacoTotais.erros,
          abaco_percentual_total: abacoTotais.percentual,
          ah_total_exercicios: ahTotais.exercicios,
          ah_total_erros: ahTotais.erros,
          ah_percentual_total: ahTotais.percentual,
        };

        console.log('=== RESULTADO FINAL (COM CONTAGEM SEPARADA DE DESAFIOS) ===');
        console.log('Nome:', resultado.nome);
        console.log('Desafios feitos (contagem separada):', resultado.desafios_feitos);
        console.log('Meses com dados ábaco:', resultado.desempenho_abaco.length);
        console.log('Meses com dados AH:', resultado.desempenho_ah.length);
        console.log('Total exercícios ábaco (sem duplicatas):', resultado.abaco_total_exercicios);
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

function processarDadosAbacoePorMes(dados: any[]): DesempenhoItem[] {
  console.log('Processando dados ábaco por mês (dados já filtrados pela RPC):', dados.length, 'registros');
  
  const dadosPorMes = new Map<string, {
    livros: Set<string>;
    exercicios: number;
    erros: number;
  }>();

  dados.forEach((item, index) => {
    // Usar data_aula para ábaco
    const data = new Date(item.data_aula);
    const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
    
    console.log(`Processando item ábaco ${index + 1}:`, {
      data_aula: item.data_aula,
      mesAno,
      exercicios: item.exercicios,
      erros: item.erros,
      apostila: item.apostila
    });
    
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

  console.log('Resultado ábaco processado (pós-RPC):', resultado);
  return resultado;
}

function processarDadosAHPorMes(dados: any[]): DesempenhoItem[] {
  console.log('Processando dados AH por mês:', dados.length, 'registros');
  
  const dadosPorMes = new Map<string, {
    livros: Set<string>;
    exercicios: number;
    erros: number;
  }>();

  dados.forEach((item, index) => {
    // Usar created_at convertido para data para AH (já que não tem data_aula)
    const data = new Date(item.created_at);
    const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
    
    console.log(`Processando item AH ${index + 1}:`, {
      created_at: item.created_at,
      mesAno,
      exercicios: item.exercicios,
      erros: item.erros,
      apostila: item.apostila
    });
    
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

  console.log('Resultado AH processado:', resultado);
  return resultado;
}

function calcularTotais(dados: DesempenhoItem[]) {
  const exercicios = dados.reduce((sum, item) => sum + item.exercicios, 0);
  const erros = dados.reduce((sum, item) => sum + item.erros, 0);
  const percentual = exercicios > 0 ? ((exercicios - erros) / exercicios) * 100 : 0;

  return { exercicios, erros, percentual };
}
