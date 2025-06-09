
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

        // Buscar alunos das turmas
        const { data: alunosData, error: alunosError } = await supabase
          .from('alunos')
          .select('id, nome')
          .in('turma_id', turmasIds)
          .eq('active', true);

        if (alunosError) {
          console.error('Erro ao buscar alunos:', alunosError);
          return;
        }

        console.log('Alunos encontrados:', alunosData);

        if (!alunosData || alunosData.length === 0) {
          console.log('Nenhum aluno encontrado nas turmas');
          setDadosAbaco([]);
          setDadosAH([]);
          return;
        }

        const nomesAlunos = alunosData.map(a => a.nome);

        // Buscar dados do Ábaco pelo nome do aluno
        const { data: abacoData, error: abacoError } = await supabase
          .from('produtividade_abaco')
          .select('*')
          .in('aluno_nome', nomesAlunos)
          .gte('data_aula', `${mesAno}-01`)
          .lte('data_aula', `${mesAno}-31`)
          .eq('presente', true);

        if (abacoError) {
          console.error('Erro ao buscar dados do Ábaco:', abacoError);
        } else {
          console.log('Dados do Ábaco encontrados:', abacoData?.length || 0);
          
          // Processar dados do ábaco agrupando por aluno
          const dadosProcessadosAbaco = processarDadosAbaco(abacoData || [], mesAno);
          setDadosAbaco(dadosProcessadosAbaco);
        }

        // Buscar dados do Abrindo Horizontes pelo pessoa_id
        const pessoasIds = alunosData.map(a => a.id);
        
        const { data: ahData, error: ahError } = await supabase
          .from('produtividade_ah')
          .select('*')
          .in('pessoa_id', pessoasIds)
          .gte('created_at', `${mesAno}-01T00:00:00.000Z`)
          .lte('created_at', `${mesAno}-31T23:59:59.999Z`);

        if (ahError) {
          console.error('Erro ao buscar dados do AH:', ahError);
        } else {
          console.log('Dados do AH encontrados:', ahData?.length || 0);
          
          // Processar dados do AH agrupando por aluno
          const dadosProcessadosAH = processarDadosAH(ahData || [], alunosData, mesAno);
          setDadosAH(dadosProcessadosAH);
        }

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

function processarDadosAbaco(dados: any[], mesAno: string): DadosAbaco[] {
  console.log('Processando dados do ábaco:', dados.length, 'registros');
  
  const dadosPorAluno = new Map<string, {
    exercicios: number;
    erros: number;
    presencas: number;
  }>();

  dados.forEach((item, index) => {
    console.log(`Processando item ábaco ${index + 1}:`, item);
    
    const nomeAluno = item.aluno_nome;
    if (!nomeAluno) return;
    
    if (!dadosPorAluno.has(nomeAluno)) {
      dadosPorAluno.set(nomeAluno, {
        exercicios: 0,
        erros: 0,
        presencas: 0
      });
    }

    const alunoData = dadosPorAluno.get(nomeAluno)!;
    
    alunoData.exercicios += item.exercicios || 0;
    alunoData.erros += item.erros || 0;
    if (item.presente) {
      alunoData.presencas += 1;
    }
  });

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

  console.log('Resultado processado ábaco:', resultado);
  return resultado;
}

function processarDadosAH(dados: any[], alunos: any[], mesAno: string): DadosAH[] {
  console.log('Processando dados do AH:', dados.length, 'registros');
  
  const dadosPorAluno = new Map<string, {
    exercicios: number;
    erros: number;
  }>();

  dados.forEach((item, index) => {
    console.log(`Processando item AH ${index + 1}:`, item);
    
    // Encontrar o nome do aluno pelo pessoa_id
    const aluno = alunos.find(a => a.id === item.pessoa_id);
    if (!aluno) return;
    
    const nomeAluno = aluno.nome;
    
    if (!dadosPorAluno.has(nomeAluno)) {
      dadosPorAluno.set(nomeAluno, {
        exercicios: 0,
        erros: 0
      });
    }

    const alunoData = dadosPorAluno.get(nomeAluno)!;
    
    alunoData.exercicios += item.exercicios || 0;
    alunoData.erros += item.erros || 0;
  });

  const resultado = Array.from(dadosPorAluno.entries()).map(([nome, dados]) => ({
    ano_mes: mesAno,
    nome_aluno: nome,
    total_exercicios: dados.exercicios,
    total_erros: dados.erros,
    percentual_acerto: dados.exercicios > 0 
      ? Math.round(((dados.exercicios - dados.erros) / dados.exercicios) * 100 * 10) / 10
      : 0
  })).sort((a, b) => a.nome_aluno.localeCompare(b.nome_aluno));

  console.log('Resultado processado AH:', resultado);
  return resultado;
}
