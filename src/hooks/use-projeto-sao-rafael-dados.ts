
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
        
        // Buscar dados do Ábaco
        const { data: abacoData, error: abacoError } = await supabase
          .from('produtividade_abaco')
          .select(`
            data_aula,
            exercicios,
            erros,
            presente,
            alunos!inner(nome, turmas!inner(professor_id, dia_semana))
          `)
          .eq('alunos.turmas.professor_id', PROFESSOR_GUSTAVO_ID)
          .eq('alunos.turmas.dia_semana', 'quinta')
          .gte('data_aula', `${mesAno}-01`)
          .lt('data_aula', `${mesAno.substring(0, 4)}-${String(parseInt(mesAno.substring(5, 7)) + 1).padStart(2, '0')}-01`);

        if (abacoError) {
          console.error('Erro ao buscar dados do Ábaco:', abacoError);
        } else {
          // Processar dados do Ábaco
          const abacoProcessado = processarDadosAbaco(abacoData || [], mesAno);
          setDadosAbaco(abacoProcessado);
        }

        // Buscar dados do Abrindo Horizontes
        const { data: ahData, error: ahError } = await supabase
          .from('produtividade_ah')
          .select(`
            created_at,
            exercicios,
            erros,
            alunos!inner(nome, turmas!inner(professor_id, dia_semana))
          `)
          .eq('alunos.turmas.professor_id', PROFESSOR_GUSTAVO_ID)
          .eq('alunos.turmas.dia_semana', 'quinta')
          .gte('created_at', `${mesAno}-01`)
          .lt('created_at', `${mesAno.substring(0, 4)}-${String(parseInt(mesAno.substring(5, 7)) + 1).padStart(2, '0')}-01`);

        if (ahError) {
          console.error('Erro ao buscar dados do AH:', ahError);
        } else {
          // Processar dados do AH
          const ahProcessado = processarDadosAH(ahData || [], mesAno);
          setDadosAH(ahProcessado);
        }

        // Buscar texto geral (se existir)
        const { data: textoData } = await supabase
          .from('projeto_sao_rafael_textos')
          .select('texto_geral')
          .eq('mes_ano', mesAno)
          .single();
        
        if (textoData) {
          setTextoGeral(textoData.texto_geral || '');
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
      const { error } = await supabase
        .from('projeto_sao_rafael_textos')
        .upsert({
          mes_ano: mesAno,
          texto_geral: texto
        });

      if (error) {
        console.error('Erro ao salvar texto geral:', error);
        return false;
      }

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
  const alunosMap = new Map<string, {
    total_exercicios: number;
    total_erros: number;
    total_presencas: number;
  }>();

  dados.forEach(item => {
    const nomeAluno = item.alunos.nome;
    const exercicios = item.exercicios || 0;
    const erros = item.erros || 0;
    const presente = item.presente;

    if (!alunosMap.has(nomeAluno)) {
      alunosMap.set(nomeAluno, {
        total_exercicios: 0,
        total_erros: 0,
        total_presencas: 0
      });
    }

    const aluno = alunosMap.get(nomeAluno)!;
    aluno.total_exercicios += exercicios;
    aluno.total_erros += erros;
    if (presente) {
      aluno.total_presencas += 1;
    }
  });

  return Array.from(alunosMap.entries()).map(([nome, dados]) => ({
    ano_mes: mesAno,
    nome_aluno: nome,
    total_exercicios: dados.total_exercicios,
    total_erros: dados.total_erros,
    percentual_acerto: dados.total_exercicios > 0 
      ? Math.round(((dados.total_exercicios - dados.total_erros) / dados.total_exercicios) * 100) 
      : 0,
    total_presencas: dados.total_presencas
  })).sort((a, b) => a.nome_aluno.localeCompare(b.nome_aluno));
}

function processarDadosAH(dados: any[], mesAno: string): DadosAH[] {
  const alunosMap = new Map<string, {
    total_exercicios: number;
    total_erros: number;
  }>();

  dados.forEach(item => {
    const nomeAluno = item.alunos.nome;
    const exercicios = item.exercicios || 0;
    const erros = item.erros || 0;

    if (!alunosMap.has(nomeAluno)) {
      alunosMap.set(nomeAluno, {
        total_exercicios: 0,
        total_erros: 0
      });
    }

    const aluno = alunosMap.get(nomeAluno)!;
    aluno.total_exercicios += exercicios;
    aluno.total_erros += erros;
  });

  return Array.from(alunosMap.entries()).map(([nome, dados]) => ({
    ano_mes: mesAno,
    nome_aluno: nome,
    total_exercicios: dados.total_exercicios,
    total_erros: dados.total_erros,
    percentual_acerto: dados.total_exercicios > 0 
      ? Math.round(((dados.total_exercicios - dados.total_erros) / dados.total_exercicios) * 100) 
      : 0
  })).sort((a, b) => a.nome_aluno.localeCompare(b.nome_aluno));
}
