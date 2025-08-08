
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export type PeriodoFiltro = 'mes_atual' | 'mes_passado' | 'trimestre' | 'quadrimestre' | 'semestre' | 'ano';

export interface DesempenhoAH {
  mes: string;
  livro: string;
  exercicios: number;
  erros: number;
  percentual_acerto: number;
}

export interface DesempenhoAbaco {
  mes: string;
  livro: string;
  pagina: number;
  exercicios: number;
  erros: number;
  percentual_acerto: number;
  presencas: number;
  desafios_feitos: number;
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
  desempenho_abaco: DesempenhoAbaco[];
  abaco_total_exercicios: number;
  abaco_total_erros: number;
  abaco_percentual_total: number;
  abaco_total_presencas: number;
  abaco_total_desafios: number;
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

        console.log('=== INICIANDO BUSCA DE DEVOLUTIVA FUNCIONÁRIO (POR ID CORRIGIDO) ===');
        console.log('Funcionário ID:', funcionarioId);
        console.log('Período:', periodo);

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

        if (!funcionarioData) {
          setError('Funcionário não encontrado');
          return;
        }

        console.log('✓ Dados do funcionário encontrados:', funcionarioData);

        // Buscar texto geral das devolutivas
        const { data: configData } = await supabase
          .from('devolutivas_config')
          .select('texto_geral')
          .limit(1)
          .single();

        console.log('✓ Configuração de devolutiva:', configData);

        // Calcular data inicial e final baseada no período (ciclos fechados de mês)
        const hoje = new Date();
        let dataInicial: Date;
        
        // CORREÇÃO: Sempre incluir o mês atual nos períodos
        switch (periodo) {
          case 'mes_atual':
            // Primeiro dia do mês atual até hoje
            dataInicial = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            break;
          case 'mes_passado':
            // Primeiro ao último dia do mês passado
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

        console.log('Buscando devolutiva do funcionário:', funcionarioId);
        console.log('Período:', periodo, 'Data inicial:', dataInicial.toISOString(), 'Data final:', dataFinal.toISOString());

        // Buscar produtividade AH usando ID do funcionário (agora corrigido)
        console.log('=== BUSCANDO PRODUTIVIDADE AH POR ID ===');
        
        const { data: produtividadeAH, error: ahError } = await supabase
          .from('produtividade_ah')
          .select('*')
          .eq('pessoa_id', funcionarioId)
          .eq('tipo_pessoa', 'funcionario')
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

        // Buscar produtividade Ábaco usando ID do funcionário
        console.log('=== BUSCANDO PRODUTIVIDADE ÁBACO POR ID ===');
        
        const { data: produtividadeAbaco, error: abacoError } = await supabase
          .from('produtividade_abaco')
          .select('*')
          .eq('pessoa_id', funcionarioId)
          .eq('tipo_pessoa', 'funcionario')
          .gte('data_aula', dataInicial.toISOString().split('T')[0])
          .lte('data_aula', dataFinal.toISOString().split('T')[0])
          .order('data_aula', { ascending: false });

        if (abacoError) {
          console.error('Erro ao buscar produtividade Ábaco:', abacoError);
        } else {
          console.log('✓ Produtividade Ábaco encontrada:', produtividadeAbaco?.length || 0, 'registros');
          if (produtividadeAbaco && produtividadeAbaco.length > 0) {
            console.log('Primeiros registros do período:', produtividadeAbaco.slice(0, 2));
          }
        }

        // Processar dados AH por mês
        const ahProcessado = processarDadosAHPorMes(produtividadeAH || []);
        const ahTotais = calcularTotaisAH(ahProcessado);

        // Processar dados Ábaco por mês
        const abacoProcessado = processarDadosAbacoPorMes(produtividadeAbaco || []);
        const abacoTotais = calcularTotaisAbaco(abacoProcessado);

        console.log('✓ Dados AH processados:', ahProcessado.length, 'meses');
        console.log('✓ Total exercícios AH:', ahTotais.exercicios);
        console.log('✓ Dados Ábaco processados:', abacoProcessado.length, 'meses');
        console.log('✓ Total exercícios Ábaco:', abacoTotais.exercicios);

        setData({
          id: funcionarioData.id,
          nome: funcionarioData.nome,
          texto_devolutiva: funcionarioData.texto_devolutiva,
          texto_geral: configData?.texto_geral || null,
          desempenho_ah: ahProcessado,
          ah_total_exercicios: ahTotais.exercicios,
          ah_total_erros: ahTotais.erros,
          ah_percentual_total: ahTotais.percentual,
          desempenho_abaco: abacoProcessado,
          abaco_total_exercicios: abacoTotais.exercicios,
          abaco_total_erros: abacoTotais.erros,
          abaco_percentual_total: abacoTotais.percentual,
          abaco_total_presencas: abacoTotais.presencas,
          abaco_total_desafios: abacoTotais.desafios
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

function processarDadosAHPorMes(dados: any[]): DesempenhoAH[] {
  console.log('Processando dados AH por mês:', dados.length, 'registros');
  
  const dadosPorMes = new Map<string, {
    livros: Set<string>;
    exercicios: number;
    erros: number;
  }>();

  dados.forEach((item, index) => {
    console.log(`Processando item AH ${index + 1}:`, item);
    
    const data = new Date(item.created_at);
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

  console.log('Resultado AH processado:', resultado);
  return resultado;
}

function calcularTotaisAH(dados: DesempenhoAH[]) {
  const exercicios = dados.reduce((sum, item) => sum + item.exercicios, 0);
  const erros = dados.reduce((sum, item) => sum + item.erros, 0);
  const percentual = exercicios > 0 ? ((exercicios - erros) / exercicios) * 100 : 0;

  return { exercicios, erros, percentual };
}

function processarDadosAbacoPorMes(dados: any[]): DesempenhoAbaco[] {
  console.log('Processando dados Ábaco por mês:', dados.length, 'registros');
  
  const dadosPorMes = new Map<string, {
    livros: Set<string>;
    exercicios: number;
    erros: number;
    presencas: number;
    desafios_feitos: number;
    paginas: Set<number>;
  }>();

  dados.forEach((item, index) => {
    console.log(`Processando item Ábaco ${index + 1}:`, item);
    
    const data = new Date(item.data_aula);
    const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
    
    if (!dadosPorMes.has(mesAno)) {
      dadosPorMes.set(mesAno, {
        livros: new Set(),
        exercicios: 0,
        erros: 0,
        presencas: 0,
        desafios_feitos: 0,
        paginas: new Set()
      });
    }

    const mesData = dadosPorMes.get(mesAno)!;
    
    if (item.apostila) {
      mesData.livros.add(item.apostila);
    }
    
    if (item.pagina) {
      mesData.paginas.add(item.pagina);
    }
    
    mesData.exercicios += item.exercicios || 0;
    mesData.erros += item.erros || 0;
    mesData.presencas += item.presente ? 1 : 0;
    mesData.desafios_feitos += item.fez_desafio ? 1 : 0;
  });

  const resultado = Array.from(dadosPorMes.entries()).map(([mes, dados]) => ({
    mes,
    livro: Array.from(dados.livros).join(', ') || 'Não informado',
    pagina: dados.paginas.size > 0 ? Math.max(...Array.from(dados.paginas)) : 0,
    exercicios: dados.exercicios,
    erros: dados.erros,
    percentual_acerto: dados.exercicios > 0 
      ? ((dados.exercicios - dados.erros) / dados.exercicios) * 100 
      : 0,
    presencas: dados.presencas,
    desafios_feitos: dados.desafios_feitos
  })).sort((a, b) => {
    const [mesA, anoA] = a.mes.split('/').map(Number);
    const [mesB, anoB] = b.mes.split('/').map(Number);
    
    if (anoA !== anoB) return anoB - anoA;
    return mesB - mesA;
  });

  console.log('Resultado Ábaco processado:', resultado);
  return resultado;
}

function calcularTotaisAbaco(dados: DesempenhoAbaco[]) {
  const exercicios = dados.reduce((sum, item) => sum + item.exercicios, 0);
  const erros = dados.reduce((sum, item) => sum + item.erros, 0);
  const presencas = dados.reduce((sum, item) => sum + item.presencas, 0);
  const desafios = dados.reduce((sum, item) => sum + item.desafios_feitos, 0);
  const percentual = exercicios > 0 ? ((exercicios - erros) / exercicios) * 100 : 0;

  return { exercicios, erros, percentual, presencas, desafios };
}
