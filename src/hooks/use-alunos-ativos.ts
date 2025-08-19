import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface AlunoAtivo {
  id: string;
  nome: string;
  turma_id: string | null;
  turma_nome: string | null;
  professor_nome: string | null;
  ultima_apostila: string | null;
  dias_supera: number | null;
  active: boolean;
  idade: number | null;
  email: string | null;
  telefone: string | null;
  whatapp_contato: string | null;
  matricula: string | null;
  codigo: string | null;
  indice: string | null;
  curso: string | null;
  ultima_pagina: number | null;
  ultimo_nivel: string | null;
  niveldesafio: string | null;
  dias_apostila: number | null;
  data_onboarding: string | null;
  motivo_procura: string | null;
  coordenador_responsavel: string | null;
  percepcao_coordenador: string | null;
  pontos_atencao: string | null;
  avaliacao_abaco: string | null;
  avaliacao_ah: string | null;
  texto_devolutiva: string | null;
  vencimento_contrato: string | null;
  ultima_falta: string | null;
  ultima_correcao_ah: string | null;
  is_funcionario: boolean | null;
  valor_mensalidade: number | null;
}

export function useAlunosAtivos() {
  const [alunos, setAlunos] = useState<AlunoAtivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    buscarAlunosAtivos();
  }, []);

  const buscarAlunosAtivos = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Iniciando busca de alunos ativos...');

      // Primeira consulta: buscar alunos ativos com todos os campos
      const { data: alunosData, error: alunosError } = await supabase
        .from('alunos')
        .select('*')
        .eq('active', true)
        .order('nome');

      if (alunosError) {
        console.error('Erro na consulta de alunos:', alunosError);
        throw alunosError;
      }

      console.log('Dados dos alunos recebidos:', alunosData);

      if (!alunosData) {
        console.log('Nenhum aluno encontrado');
        setAlunos([]);
        return;
      }

      // Buscar informações das turmas
      const turmaIds = alunosData
        .map(aluno => aluno.turma_id)
        .filter(Boolean) as string[];

      console.log('IDs das turmas para buscar:', turmaIds);

      let turmasData: any[] = [];
      if (turmaIds.length > 0) {
        const { data: turmasResult, error: turmasError } = await supabase
          .from('turmas')
          .select('id, nome, professor_id')
          .in('id', turmaIds);

        if (turmasError) {
          console.error('Erro ao buscar turmas:', turmasError);
        } else {
          turmasData = turmasResult || [];
        }
      }

      console.log('Dados das turmas recebidos:', turmasData);

      // Buscar informações dos professores
      const professorIds = turmasData
        .map(turma => turma.professor_id)
        .filter(Boolean) as string[];

      console.log('IDs dos professores para buscar:', professorIds);

      let professoresData: any[] = [];
      if (professorIds.length > 0) {
        const { data: professoresResult, error: professoresError } = await supabase
          .from('professores')
          .select('id, nome')
          .in('id', professorIds);

        if (professoresError) {
          console.error('Erro ao buscar professores:', professoresError);
        } else {
          professoresData = professoresResult || [];
        }
      }

      console.log('Dados dos professores recebidos:', professoresData);

      // Mapear dados dos alunos com informações das turmas e professores
      const alunosComDados = await Promise.all(
        alunosData.map(async (aluno: any) => {
          console.log('Processando aluno:', aluno.nome);
          
          // Encontrar dados da turma
          const turma = turmasData.find(t => t.id === aluno.turma_id);
          
          // Encontrar dados do professor
          const professor = turma ? professoresData.find(p => p.id === turma.professor_id) : null;
          
          // Buscar a última apostila registrada no ábaco
          let ultimaApostila: string | null = null;
          try {
            const { data: apostilaData, error: apostilaError } = await supabase
              .from('produtividade_abaco')
              .select('apostila')
              .eq('pessoa_id', aluno.id)
              .not('apostila', 'is', null)
              .order('data_aula', { ascending: false })
              .limit(1);

            if (apostilaError) {
              console.error('Erro ao buscar última apostila para aluno', aluno.nome, ':', apostilaError);
            } else if (apostilaData && apostilaData.length > 0) {
              ultimaApostila = apostilaData[0].apostila;
            }
          } catch (error) {
            console.error('Erro inesperado ao buscar apostila:', error);
          }

          const alunoProcessado: AlunoAtivo = {
            ...aluno,
            turma_nome: turma?.nome || null,
            professor_nome: professor?.nome || null,
            ultima_apostila: ultimaApostila,
          };

          console.log('Aluno processado:', alunoProcessado);
          return alunoProcessado;
        })
      );

      setAlunos(alunosComDados);
      console.log(`Carregados ${alunosComDados.length} alunos ativos com sucesso`);

    } catch (err) {
      console.error('Erro ao buscar alunos ativos:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao carregar alunos ativos: ${errorMessage}`);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de alunos ativos. Verifique o console para mais detalhes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const atualizarWhatsApp = async (alunoId: string, whatsapp: string) => {
    try {
      const { error } = await supabase
        .from('alunos')
        .update({ whatapp_contato: whatsapp } as any)
        .eq('id', alunoId);

      if (error) throw error;

      // Atualizar o estado local
      setAlunos(prev => prev.map(aluno => 
        aluno.id === alunoId 
          ? { ...aluno, whatapp_contato: whatsapp }
          : aluno
      ));

      toast({
        title: "Sucesso",
        description: "WhatsApp atualizado com sucesso.",
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar WhatsApp:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o WhatsApp.",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    alunos,
    loading,
    error,
    refetch: buscarAlunosAtivos,
    atualizarWhatsApp
  };
}