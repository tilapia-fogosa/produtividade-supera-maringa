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
  responsavel: string | null;
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
  valor_matricula: number | null;
  valor_material: number | null;
  kit_sugerido: string | null;
  data_primeira_mensalidade: string | null;
  foto_url: string | null;
  foto_devolutiva_url: string | null;
  pdf_devolutiva_url: string | null;
  data_nascimento: string | null;
  aniversario_mes_dia: string | null;
  tipo_pessoa: 'aluno' | 'funcionario';
  cargo?: string | null;
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

      console.log('Iniciando busca de alunos ativos e funcionários ativos...');

      // Primeira consulta: buscar apenas alunos ativos (excluindo funcionários)
      const { data: alunosData, error: alunosError } = await supabase
        .from('alunos')
        .select('*')
        .eq('active', true)
        .or('is_funcionario.is.null,is_funcionario.eq.false')
        .order('nome');

      if (alunosError) {
        console.error('Erro na consulta de alunos:', alunosError);
        throw alunosError;
      }

      // Segunda consulta: buscar funcionários ativos
      const { data: funcionariosData, error: funcionariosError } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('active', true)
        .order('nome');

      if (funcionariosError) {
        console.error('Erro na consulta de funcionários:', funcionariosError);
        throw funcionariosError;
      }

      console.log('Dados dos alunos recebidos:', alunosData);
      console.log('Dados dos funcionários recebidos:', funcionariosData);

      const todasPessoas = [
        ...(alunosData || []).map((aluno: any) => ({ ...aluno, tipo_pessoa: 'aluno' as const })),
        ...(funcionariosData || []).map((funcionario: any) => ({ ...funcionario, tipo_pessoa: 'funcionario' as const }))
      ];

      if (todasPessoas.length === 0) {
        console.log('Nenhuma pessoa encontrada');
        setAlunos([]);
        return;
      }

      // Buscar informações das turmas
      const turmaIds = todasPessoas
        .map(pessoa => pessoa.turma_id)
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

      // Mapear dados das pessoas com informações das turmas e professores
      const pessoasComDados = await Promise.all(
        todasPessoas.map(async (pessoa: any) => {
          console.log('Processando pessoa:', pessoa.nome, '- Tipo:', pessoa.tipo_pessoa);
          
          // Encontrar dados da turma
          const turma = turmasData.find(t => t.id === pessoa.turma_id);
          
          // Encontrar dados do professor
          const professor = turma ? professoresData.find(p => p.id === turma.professor_id) : null;
          
          // Buscar a última apostila registrada no ábaco
          let ultimaApostila: string | null = null;
          try {
            const { data: apostilaData, error: apostilaError } = await supabase
              .from('produtividade_abaco')
              .select('apostila')
              .eq('pessoa_id', pessoa.id)
              .not('apostila', 'is', null)
              .order('data_aula', { ascending: false })
              .limit(1);

            if (apostilaError) {
              console.error('Erro ao buscar última apostila para pessoa', pessoa.nome, ':', apostilaError);
            } else if (apostilaData && apostilaData.length > 0) {
              ultimaApostila = apostilaData[0].apostila;
            }
          } catch (error) {
            console.error('Erro inesperado ao buscar apostila:', error);
          }

          const pessoaProcessada: AlunoAtivo = {
            ...pessoa,
            turma_nome: turma?.nome || null,
            professor_nome: professor?.nome || null,
            ultima_apostila: ultimaApostila,
            // Garantir que funcionários têm is_funcionario = true para compatibilidade
            is_funcionario: pessoa.tipo_pessoa === 'funcionario' ? true : (pessoa.is_funcionario || false),
          };

          console.log('Pessoa processada:', pessoaProcessada);
          return pessoaProcessada;
        })
      );

      setAlunos(pessoasComDados);
      console.log(`Carregadas ${pessoasComDados.length} pessoas ativas com sucesso`);

    } catch (err) {
      console.error('Erro ao buscar pessoas ativas:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao carregar pessoas ativas: ${errorMessage}`);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de pessoas ativas. Verifique o console para mais detalhes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const atualizarWhatsApp = async (alunoId: string, whatsapp: string) => {
    try {
      // Identificar se é aluno ou funcionário
      const pessoa = alunos.find(a => a.id === alunoId);
      if (!pessoa) throw new Error('Pessoa não encontrada');

      const tabela = pessoa.tipo_pessoa === 'funcionario' ? 'funcionarios' : 'alunos';
      
      const { error } = await supabase
        .from(tabela)
        .update({ whatapp_contato: whatsapp } as any)
        .eq('id', alunoId);

      if (error) throw error;

      // Atualizar o estado local
      setAlunos(prev => prev.map(aluno => 
        aluno.id === alunoId 
          ? { ...aluno, whatapp_contato: whatsapp }
          : aluno
      ));

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

  const atualizarResponsavel = async (alunoId: string, responsavel: string) => {
    try {
      // Identificar se é aluno ou funcionário
      const pessoa = alunos.find(a => a.id === alunoId);
      if (!pessoa) throw new Error('Pessoa não encontrada');

      const tabela = pessoa.tipo_pessoa === 'funcionario' ? 'funcionarios' : 'alunos';
      
      const { error } = await supabase
        .from(tabela)
        .update({ responsavel: responsavel } as any)
        .eq('id', alunoId);

      if (error) throw error;

      // Atualizar o estado local
      setAlunos(prev => prev.map(aluno => 
        aluno.id === alunoId 
          ? { ...aluno, responsavel: responsavel }
          : aluno
      ));

      return true;
    } catch (error) {
      console.error('Erro ao atualizar responsável:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o responsável.",
        variant: "destructive"
      });
      return false;
    }
  };

  const atualizarFoto = async (alunoId: string, fotoUrl: string | null) => {
    try {
      console.log('Atualizando foto no banco:', { alunoId, fotoUrl });
      
      // Identificar se é aluno ou funcionário
      const pessoa = alunos.find(a => a.id === alunoId);
      if (!pessoa) {
        console.error('Pessoa não encontrada:', alunoId);
        throw new Error('Pessoa não encontrada');
      }

      const tabela = pessoa.tipo_pessoa === 'funcionario' ? 'funcionarios' : 'alunos';
      console.log('Atualizando na tabela:', tabela);
      
      const { error } = await supabase
        .from(tabela)
        .update({ foto_url: fotoUrl } as any)
        .eq('id', alunoId);

      if (error) {
        console.error('Erro na atualização do banco:', error);
        throw error;
      }

      console.log('Foto atualizada no banco com sucesso');

      // Atualizar o estado local
      setAlunos(prev => prev.map(aluno => 
        aluno.id === alunoId 
          ? { ...aluno, foto_url: fotoUrl }
          : aluno
      ));

      console.log('Estado local atualizado');

      return true;
    } catch (error) {
      console.error('Erro ao atualizar foto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a foto.",
        variant: "destructive"
      });
      return false;
    }
  };

  const atualizarDataNascimento = async (alunoId: string, dataNascimento: string): Promise<boolean> => {
    try {
      const pessoa = alunos.find(a => a.id === alunoId);
      if (!pessoa) throw new Error('Pessoa não encontrada');

      const tabela = pessoa.tipo_pessoa === 'funcionario' ? 'funcionarios' : 'alunos';
      
      const { error } = await supabase
        .from(tabela)
        .update({ data_nascimento: dataNascimento } as any)
        .eq('id', alunoId);

      if (error) throw error;

      // Atualizar estado local
      setAlunos(prev => prev.map(aluno =>
        aluno.id === alunoId ? { ...aluno, data_nascimento: dataNascimento } : aluno
      ));

      return true;
    } catch (error) {
      console.error('Erro ao atualizar data de nascimento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a data de nascimento.",
        variant: "destructive"
      });
      return false;
    }
  };

  const atualizarEmail = async (alunoId: string, email: string): Promise<boolean> => {
    try {
      const pessoa = alunos.find(a => a.id === alunoId);
      if (!pessoa) throw new Error('Pessoa não encontrada');

      const tabela = pessoa.tipo_pessoa === 'funcionario' ? 'funcionarios' : 'alunos';
      
      const { error } = await supabase
        .from(tabela)
        .update({ email } as any)
        .eq('id', alunoId);

      if (error) throw error;

      setAlunos(prev => prev.map(aluno =>
        aluno.id === alunoId ? { ...aluno, email } : aluno
      ));

      return true;
    } catch (error) {
      console.error('Erro ao atualizar email:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o email.",
        variant: "destructive"
      });
      return false;
    }
  };

  const atualizarTelefone = async (alunoId: string, telefone: string): Promise<boolean> => {
    try {
      const pessoa = alunos.find(a => a.id === alunoId);
      if (!pessoa) throw new Error('Pessoa não encontrada');

      const tabela = pessoa.tipo_pessoa === 'funcionario' ? 'funcionarios' : 'alunos';
      
      const { error } = await supabase
        .from(tabela)
        .update({ telefone } as any)
        .eq('id', alunoId);

      if (error) throw error;

      setAlunos(prev => prev.map(aluno =>
        aluno.id === alunoId ? { ...aluno, telefone } : aluno
      ));

      return true;
    } catch (error) {
      console.error('Erro ao atualizar telefone:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o telefone.",
        variant: "destructive"
      });
      return false;
    }
  };

  const atualizarCoordenadorResponsavel = async (alunoId: string, coordenador: string): Promise<boolean> => {
    try {
      const pessoa = alunos.find(a => a.id === alunoId);
      if (!pessoa) throw new Error('Pessoa não encontrada');

      const tabela = pessoa.tipo_pessoa === 'funcionario' ? 'funcionarios' : 'alunos';
      
      const { error } = await supabase
        .from(tabela)
        .update({ coordenador_responsavel: coordenador } as any)
        .eq('id', alunoId);

      if (error) throw error;

      setAlunos(prev => prev.map(aluno =>
        aluno.id === alunoId ? { ...aluno, coordenador_responsavel: coordenador } : aluno
      ));

      return true;
    } catch (error) {
      console.error('Erro ao atualizar coordenador:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o coordenador responsável.",
        variant: "destructive"
      });
      return false;
    }
  };

  const atualizarValorMensalidade = async (alunoId: string, valor: number): Promise<boolean> => {
    try {
      const pessoa = alunos.find(a => a.id === alunoId);
      if (!pessoa) throw new Error('Pessoa não encontrada');

      const tabela = pessoa.tipo_pessoa === 'funcionario' ? 'funcionarios' : 'alunos';
      
      const { error } = await supabase
        .from(tabela)
        .update({ valor_mensalidade: valor } as any)
        .eq('id', alunoId);

      if (error) throw error;

      setAlunos(prev => prev.map(aluno =>
        aluno.id === alunoId ? { ...aluno, valor_mensalidade: valor } : aluno
      ));

      return true;
    } catch (error) {
      console.error('Erro ao atualizar valor da mensalidade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o valor da mensalidade.",
        variant: "destructive"
      });
      return false;
    }
  };

  const atualizarVencimentoContrato = async (alunoId: string, vencimento: string): Promise<boolean> => {
    try {
      const pessoa = alunos.find(a => a.id === alunoId);
      if (!pessoa) throw new Error('Pessoa não encontrada');

      const tabela = pessoa.tipo_pessoa === 'funcionario' ? 'funcionarios' : 'alunos';
      
      const { error } = await supabase
        .from(tabela)
        .update({ vencimento_contrato: vencimento } as any)
        .eq('id', alunoId);

      if (error) throw error;

      setAlunos(prev => prev.map(aluno =>
        aluno.id === alunoId ? { ...aluno, vencimento_contrato: vencimento } : aluno
      ));

      return true;
    } catch (error) {
      console.error('Erro ao atualizar vencimento do contrato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o vencimento do contrato.",
        variant: "destructive"
      });
      return false;
    }
  };

  const atualizarMotivoProcura = async (alunoId: string, motivo: string): Promise<boolean> => {
    try {
      const pessoa = alunos.find(a => a.id === alunoId);
      if (!pessoa) throw new Error('Pessoa não encontrada');

      const tabela = pessoa.tipo_pessoa === 'funcionario' ? 'funcionarios' : 'alunos';
      
      const { error } = await supabase
        .from(tabela)
        .update({ motivo_procura: motivo } as any)
        .eq('id', alunoId);

      if (error) throw error;

      setAlunos(prev => prev.map(aluno =>
        aluno.id === alunoId ? { ...aluno, motivo_procura: motivo } : aluno
      ));

      return true;
    } catch (error) {
      console.error('Erro ao atualizar motivo da procura:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o motivo da procura.",
        variant: "destructive"
      });
      return false;
    }
  };

  const atualizarPercepcaoCoordenador = async (alunoId: string, percepcao: string): Promise<boolean> => {
    try {
      const pessoa = alunos.find(a => a.id === alunoId);
      if (!pessoa) throw new Error('Pessoa não encontrada');

      const tabela = pessoa.tipo_pessoa === 'funcionario' ? 'funcionarios' : 'alunos';
      
      const { error } = await supabase
        .from(tabela)
        .update({ percepcao_coordenador: percepcao } as any)
        .eq('id', alunoId);

      if (error) throw error;

      setAlunos(prev => prev.map(aluno =>
        aluno.id === alunoId ? { ...aluno, percepcao_coordenador: percepcao } : aluno
      ));

      return true;
    } catch (error) {
      console.error('Erro ao atualizar percepção do coordenador:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a percepção do coordenador.",
        variant: "destructive"
      });
      return false;
    }
  };

  const atualizarPontosAtencao = async (alunoId: string, pontos: string): Promise<boolean> => {
    try {
      const pessoa = alunos.find(a => a.id === alunoId);
      if (!pessoa) throw new Error('Pessoa não encontrada');

      const tabela = pessoa.tipo_pessoa === 'funcionario' ? 'funcionarios' : 'alunos';
      
      const { error } = await supabase
        .from(tabela)
        .update({ pontos_atencao: pontos } as any)
        .eq('id', alunoId);

      if (error) throw error;

      setAlunos(prev => prev.map(aluno =>
        aluno.id === alunoId ? { ...aluno, pontos_atencao: pontos } : aluno
      ));

      return true;
    } catch (error) {
      console.error('Erro ao atualizar pontos de atenção:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os pontos de atenção.",
        variant: "destructive"
      });
      return false;
    }
  };

  const atualizarDataOnboarding = async (alunoId: string, dataOnboarding: string): Promise<boolean> => {
    try {
      const pessoa = alunos.find(a => a.id === alunoId);
      if (!pessoa) throw new Error('Pessoa não encontrada');

      const tabela = pessoa.tipo_pessoa === 'funcionario' ? 'funcionarios' : 'alunos';
      
      const { error } = await supabase
        .from(tabela)
        .update({ data_onboarding: dataOnboarding } as any)
        .eq('id', alunoId);

      if (error) throw error;

      setAlunos(prev => prev.map(aluno =>
        aluno.id === alunoId ? { ...aluno, data_onboarding: dataOnboarding } : aluno
      ));

      return true;
    } catch (error) {
      console.error('Erro ao atualizar data de onboarding:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a data de onboarding.",
        variant: "destructive"
      });
      return false;
    }
  };

  const atualizarValorMatricula = async (alunoId: string, valor: number): Promise<boolean> => {
    try {
      const pessoa = alunos.find(a => a.id === alunoId);
      if (!pessoa) throw new Error('Pessoa não encontrada');

      const tabela = pessoa.tipo_pessoa === 'funcionario' ? 'funcionarios' : 'alunos';
      
      const { error } = await supabase
        .from(tabela)
        .update({ valor_matricula: valor } as any)
        .eq('id', alunoId);

      if (error) throw error;

      setAlunos(prev => prev.map(aluno =>
        aluno.id === alunoId ? { ...aluno, valor_matricula: valor } : aluno
      ));

      return true;
    } catch (error) {
      console.error('Erro ao atualizar valor da matrícula:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o valor da matrícula.",
        variant: "destructive"
      });
      return false;
    }
  };

  const atualizarValorMaterial = async (alunoId: string, valor: number): Promise<boolean> => {
    try {
      const pessoa = alunos.find(a => a.id === alunoId);
      if (!pessoa) throw new Error('Pessoa não encontrada');

      const tabela = pessoa.tipo_pessoa === 'funcionario' ? 'funcionarios' : 'alunos';
      
      const { error } = await supabase
        .from(tabela)
        .update({ valor_material: valor } as any)
        .eq('id', alunoId);

      if (error) throw error;

      setAlunos(prev => prev.map(aluno =>
        aluno.id === alunoId ? { ...aluno, valor_material: valor } : aluno
      ));

      return true;
    } catch (error) {
      console.error('Erro ao atualizar valor do material:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o valor do material.",
        variant: "destructive"
      });
      return false;
    }
  };

  const atualizarKitSugerido = async (alunoId: string, kit: string): Promise<boolean> => {
    try {
      const pessoa = alunos.find(a => a.id === alunoId);
      if (!pessoa) throw new Error('Pessoa não encontrada');

      const tabela = pessoa.tipo_pessoa === 'funcionario' ? 'funcionarios' : 'alunos';
      
      const { error } = await supabase
        .from(tabela)
        .update({ kit_sugerido: kit } as any)
        .eq('id', alunoId);

      if (error) throw error;

      setAlunos(prev => prev.map(aluno =>
        aluno.id === alunoId ? { ...aluno, kit_sugerido: kit } : aluno
      ));

      return true;
    } catch (error) {
      console.error('Erro ao atualizar kit inicial:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o kit inicial.",
        variant: "destructive"
      });
      return false;
    }
  };

  const atualizarDataPrimeiraMensalidade = async (alunoId: string, data: string): Promise<boolean> => {
    try {
      const pessoa = alunos.find(a => a.id === alunoId);
      if (!pessoa) throw new Error('Pessoa não encontrada');

      // Apenas para alunos, não funcionários
      if (pessoa.tipo_pessoa === 'funcionario') return false;

      const { error } = await supabase
        .from('alunos')
        .update({ data_primeira_mensalidade: data } as any)
        .eq('id', alunoId);

      if (error) throw error;

      setAlunos(prev => prev.map(aluno =>
        aluno.id === alunoId ? { ...aluno, data_primeira_mensalidade: data } as any : aluno
      ));

      return true;
    } catch (error) {
      console.error('Erro ao atualizar data da primeira mensalidade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a data da primeira mensalidade.",
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
    atualizarWhatsApp,
    atualizarResponsavel,
    atualizarFoto,
    atualizarDataNascimento,
    atualizarEmail,
    atualizarTelefone,
    atualizarCoordenadorResponsavel,
    atualizarValorMensalidade,
    atualizarVencimentoContrato,
    atualizarMotivoProcura,
    atualizarPercepcaoCoordenador,
    atualizarPontosAtencao,
    atualizarDataOnboarding,
    atualizarValorMatricula,
    atualizarValorMaterial,
    atualizarKitSugerido,
    atualizarDataPrimeiraMensalidade,
  };
}