
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
        console.log('=== INICIANDO BUSCA DE DEVOLUTIVA (DIAGNOSTICO DETALHADO) ===');
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
        let dataFinal: Date;
        
        switch (periodo) {
          case 'mes_atual':
            dataInicial = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            dataFinal = hoje;
            break;
          case 'mes_passado':
            dataInicial = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
            dataFinal = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
            break;
          case 'trimestre':
            dataInicial = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1);
            dataFinal = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
            break;
          case 'quadrimestre':
            dataInicial = new Date(hoje.getFullYear(), hoje.getMonth() - 4, 1);
            dataFinal = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
            break;
          case 'semestre':
            dataInicial = new Date(hoje.getFullYear(), hoje.getMonth() - 6, 1);
            dataFinal = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
            break;
          case 'ano':
            dataInicial = new Date(hoje.getFullYear() - 1, hoje.getMonth(), 1);
            dataFinal = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
            break;
          default:
            dataInicial = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            dataFinal = hoje;
        }

        const dataInicialFormatada = dataInicial.toISOString().split('T')[0];
        const dataFinalFormatada = dataFinal.toISOString().split('T')[0];
        
        console.log('✓ Período de busca:', dataInicialFormatada, 'até', dataFinalFormatada);

        // DIAGNÓSTICO: Verificar se existem registros para este aluno
        console.log('=== DIAGNÓSTICO: VERIFICANDO REGISTROS EXISTENTES ===');
        
        const { data: abacoAll, error: abacoAllError } = await supabase
          .from('produtividade_abaco')
          .select('*')
          .eq('pessoa_id', alunoId)
          .eq('tipo_pessoa', 'aluno')
          .order('data_aula', { ascending: false })
          .limit(5);

        console.log('Registros ábaco encontrados (últimos 5):', abacoAll);
        if (abacoAllError) console.error('Erro ao buscar registros ábaco:', abacoAllError);

        const { data: ahAll, error: ahAllError } = await supabase
          .from('produtividade_ah')
          .select('*')
          .eq('pessoa_id', alunoId)
          .eq('tipo_pessoa', 'aluno')
          .order('created_at', { ascending: false })
          .limit(5);

        console.log('Registros AH encontrados (últimos 5):', ahAll);
        if (ahAllError) console.error('Erro ao buscar registros AH:', ahAllError);

        // DIAGNÓSTICO: Verificar registros antigos por nome também
        console.log('=== DIAGNÓSTICO: VERIFICANDO REGISTROS POR NOME ===');
        
        const { data: abacoPorNome } = await supabase
          .from('produtividade_abaco')
          .select('*')
          .eq('aluno_nome', alunoData.nome)
          .eq('tipo_pessoa', 'aluno')
          .order('data_aula', { ascending: false })
          .limit(3);

        console.log('Registros ábaco por nome:', abacoPorNome);

        const { data: ahPorNome } = await supabase
          .from('produtividade_ah')
          .select('*')
          .eq('aluno_nome', alunoData.nome)
          .eq('tipo_pessoa', 'aluno')
          .order('created_at', { ascending: false })
          .limit(3);

        console.log('Registros AH por nome:', ahPorNome);

        // Agora buscar dados do período específico
        console.log('=== BUSCANDO DADOS DO PERÍODO ESPECÍFICO ===');
        
        const { data: produtividadeAbaco, error: abacoError } = await supabase
          .from('produtividade_abaco')
          .select('*')
          .eq('pessoa_id', alunoId)
          .eq('tipo_pessoa', 'aluno')
          .gte('data_aula', dataInicialFormatada)
          .lte('data_aula', dataFinalFormatada)
          .eq('presente', true)
          .order('data_aula', { ascending: false });

        console.log('Dados ábaco no período:', produtividadeAbaco?.length || 0, 'registros');
        if (produtividadeAbaco && produtividadeAbaco.length > 0) {
          console.log('Primeiros registros ábaco:', produtividadeAbaco.slice(0, 2));
        }

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
        if (produtividadeAH && produtividadeAH.length > 0) {
          console.log('Primeiros registros AH:', produtividadeAH.slice(0, 2));
        }

        // Processar dados
        const abacoProcessado = processarDadosAbacoePorMes(produtividadeAbaco || []);
        const ahProcessado = processarDadosAHPorMes(produtividadeAH || []);

        console.log('✓ Dados ábaco processados:', abacoProcessado);
        console.log('✓ Dados AH processados:', ahProcessado);

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

function processarDadosAbacoePorMes(dados: any[]): DesempenhoItem[] {
  console.log('Processando dados ábaco por mês:', dados.length, 'registros');
  
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

  console.log('Resultado ábaco processado:', resultado);
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
