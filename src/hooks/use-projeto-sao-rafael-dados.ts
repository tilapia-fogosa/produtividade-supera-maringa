
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

const PROFESSOR_GUSTAVO_ID = '4cda6590-6e4d-4359-a88f-f5e0ce59c5f4';

interface DadosAbaco {
  ano_mes: string;
  nome_aluno: string;
  total_exercicios: number;
  total_erros: number;
  percentual_acerto: number;
  total_presencas: number;
}

interface DadosAH {
  ano_mes: string;
  nome_aluno: string;
  total_exercicios: number;
  total_erros: number;
  percentual_acerto: number;
}

export function useProjetoSaoRafaelDados(mesAno: string) {
  const [dadosAbaco, setDadosAbaco] = useState<DadosAbaco[]>([]);
  const [dadosAH, setDadosAH] = useState<DadosAH[]>([]);
  const [textoGeral, setTextoGeral] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        setLoading(true);
        
        console.log('Buscando dados para o mês:', mesAno);
        
        // Primeiro, buscar alunos das turmas do Professor Gustavo (quinta-feira)
        const { data: turmasData, error: turmasError } = await supabase
          .from('turmas')
          .select('id, nome')
          .eq('professor_id', PROFESSOR_GUSTAVO_ID)
          .eq('dia_semana', 'quinta');

        if (turmasError) {
          console.error('Erro ao buscar turmas:', turmasError);
          return;
        }

        console.log('Turmas encontradas:', turmasData);

        if (!turmasData || turmasData.length === 0) {
          console.log('Nenhuma turma encontrada para o professor');
          setDadosAbaco([]);
          setDadosAH([]);
          return;
        }

        const turmasIds = turmasData.map(t => t.id);

        // Buscar TODOS os alunos das turmas (ativos)
        const { data: alunosData, error: alunosError } = await supabase
          .from('alunos')
          .select('id, nome')
          .in('turma_id', turmasIds)
          .eq('active', true);

        if (alunosError) {
          console.error('Erro ao buscar alunos:', alunosError);
          return;
        }

        console.log('Todos os alunos encontrados:', alunosData);

        if (!alunosData || alunosData.length === 0) {
          console.log('Nenhum aluno encontrado nas turmas');
          setDadosAbaco([]);
          setDadosAH([]);
          return;
        }

        // Processar dados do Ábaco para TODOS os alunos
        const dadosProcessadosAbaco = await processarDadosAbacoTodosAlunos(alunosData, mesAno);
        setDadosAbaco(dadosProcessadosAbaco);

        // Processar dados do AH para TODOS os alunos  
        const dadosProcessadosAH = await processarDadosAHTodosAlunos(alunosData, mesAno);
        setDadosAH(dadosProcessadosAH);

        // Buscar texto geral
        const { data: textoData, error: textoError } = await supabase
          .from('projeto_sao_rafael_textos')
          .select('texto_geral')
          .eq('mes_ano', mesAno)
          .maybeSingle();
        
        if (!textoError && textoData) {
          setTextoGeral(textoData.texto_geral || '');
        } else {
          setTextoGeral('');
        }

      } catch (error) {
        console.error('Erro ao buscar dados do Projeto São Rafael:', error);
      } finally {
        setLoading(false);
      }
    };

    if (mesAno) {
      fetchDados();
    }
  }, [mesAno]);

  const salvarTextoGeral = async (texto: string) => {
    try {
      console.log('Salvando texto geral para o mês:', mesAno);
      console.log('Texto:', texto);

      // Verificar se já existe um registro para este mês
      const { data: existingRecord, error: checkError } = await supabase
        .from('projeto_sao_rafael_textos')
        .select('id')
        .eq('mes_ano', mesAno)
        .maybeSingle();

      if (checkError) {
        console.error('Erro ao verificar registro existente:', checkError);
        return false;
      }

      if (existingRecord) {
        // Registro existe, fazer UPDATE
        console.log('Registro existente encontrado, fazendo UPDATE');
        const { error: updateError } = await supabase
          .from('projeto_sao_rafael_textos')
          .update({ texto_geral: texto })
          .eq('mes_ano', mesAno);

        if (updateError) {
          console.error('Erro ao atualizar texto geral:', updateError);
          return false;
        }
      } else {
        // Registro não existe, fazer INSERT
        console.log('Nenhum registro existente, fazendo INSERT');
        const { error: insertError } = await supabase
          .from('projeto_sao_rafael_textos')
          .insert({
            mes_ano: mesAno,
            texto_geral: texto
          });

        if (insertError) {
          console.error('Erro ao inserir texto geral:', insertError);
          return false;
        }
      }

      console.log('Texto geral salvo com sucesso');
      setTextoGeral(texto);
      return true;
    } catch (error) {
      console.error('Erro ao salvar texto geral:', error);
      return false;
    }
  };

  return {
    dadosAbaco,
    dadosAH,
    textoGeral,
    loading,
    salvarTextoGeral
  };
}

async function processarDadosAbacoTodosAlunos(alunos: any[], mesAno: string): Promise<DadosAbaco[]> {
  console.log('Processando dados do ábaco para todos os alunos:', alunos.length);
  
  // Buscar dados de produtividade para o período
  const { data: produtividadeData, error } = await supabase
    .from('produtividade_abaco')
    .select('*')
    .in('aluno_nome', alunos.map(a => a.nome))
    .gte('data_aula', `${mesAno}-01`)
    .lte('data_aula', `${mesAno}-31`);

  if (error) {
    console.error('Erro ao buscar dados de produtividade ábaco:', error);
  }

  console.log('Dados de produtividade ábaco encontrados:', produtividadeData?.length || 0);

  // Agrupar dados por aluno
  const dadosPorAluno = new Map<string, {
    exercicios: number;
    erros: number;
    presencas: number;
  }>();

  // Inicializar todos os alunos com zeros
  alunos.forEach(aluno => {
    dadosPorAluno.set(aluno.nome, {
      exercicios: 0,
      erros: 0,
      presencas: 0
    });
  });

  // Processar dados de produtividade se existirem
  if (produtividadeData) {
    produtividadeData.forEach((item, index) => {
      console.log(`Processando item ábaco ${index + 1}:`, item);
      
      const nomeAluno = item.aluno_nome;
      if (!nomeAluno || !dadosPorAluno.has(nomeAluno)) return;
      
      const alunoData = dadosPorAluno.get(nomeAluno)!;
      
      alunoData.exercicios += item.exercicios || 0;
      alunoData.erros += item.erros || 0;
      if (item.presente) {
        alunoData.presencas += 1;
      }
    });
  }

  const resultado = Array.from(dadosPorAluno.entries()).map(([nome, dados]) => ({
    ano_mes: mesAno,
    nome_aluno: nome,
    total_exercicios: dados.exercicios,
    total_erros: dados.erros,
    percentual_acerto: dados.exercicios > 0 
      ? Math.round(((dados.exercicios - dados.erros) / dados.exercicios) * 100 * 10) / 10
      : 0,
    total_presencas: dados.presencas
  })).sort((a, b) => a.nome_aluno.localeCompare(b.nome_aluno));

  console.log('Resultado processado ábaco (todos os alunos):', resultado);
  return resultado;
}

async function processarDadosAHTodosAlunos(alunos: any[], mesAno: string): Promise<DadosAH[]> {
  console.log('Processando dados do AH para todos os alunos:', alunos.length);
  
  // Buscar dados de produtividade AH para o período
  const { data: produtividadeAHData, error } = await supabase
    .from('produtividade_ah')
    .select('*')
    .in('aluno_nome', alunos.map(a => a.nome))
    .gte('created_at', `${mesAno}-01T00:00:00.000Z`)
    .lte('created_at', `${mesAno}-31T23:59:59.999Z`);

  if (error) {
    console.error('Erro ao buscar dados de produtividade AH:', error);
  }

  console.log('Dados de produtividade AH encontrados:', produtividadeAHData?.length || 0);

  // Agrupar dados por aluno
  const dadosPorAluno = new Map<string, {
    exercicios: number;
    erros: number;
  }>();

  // Inicializar todos os alunos com zeros
  alunos.forEach(aluno => {
    dadosPorAluno.set(aluno.nome, {
      exercicios: 0,
      erros: 0
    });
  });

  // Processar dados de produtividade se existirem
  if (produtividadeAHData) {
    produtividadeAHData.forEach((item, index) => {
      console.log(`Processando item AH ${index + 1}:`, item);
      
      const nomeAluno = item.aluno_nome;
      if (!nomeAluno || !dadosPorAluno.has(nomeAluno)) return;
      
      const alunoData = dadosPorAluno.get(nomeAluno)!;
      
      alunoData.exercicios += item.exercicios || 0;
      alunoData.erros += item.erros || 0;
    });
  }

  const resultado = Array.from(dadosPorAluno.entries()).map(([nome, dados]) => ({
    ano_mes: mesAno,
    nome_aluno: nome,
    total_exercicios: dados.exercicios,
    total_erros: dados.erros,
    percentual_acerto: dados.exercicios > 0 
      ? Math.round(((dados.exercicios - dados.erros) / dados.exercicios) * 100 * 10) / 10
      : 0
  })).sort((a, b) => a.nome_aluno.localeCompare(b.nome_aluno));

  console.log('Resultado processado AH (todos os alunos):', resultado);
  return resultado;
}
