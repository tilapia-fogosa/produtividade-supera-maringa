
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Aluno } from '@/hooks/use-alunos';
import { Funcionario } from '@/hooks/use-funcionarios';

export interface PessoaTurma {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  turma_id: string;
  active: boolean;
  origem: 'aluno' | 'funcionario';
  unit_id?: string;
  codigo?: string;
  ultimo_nivel?: string;
  ultima_pagina?: number;
  niveldesafio?: string; // Alterado para string
  ultima_correcao_ah?: string;
  data_onboarding?: string | null;
  cargo?: string | null;
  // Novos campos para último registro
  data_ultimo_registro?: string;
  ultimo_registro_id?: string;
  // Campos comuns adicionais que podem ser necessários
}

export function usePessoasTurma() {
  const [pessoasTurma, setPessoasTurma] = useState<PessoaTurma[]>([]);
  const [todasPessoas, setTodasPessoas] = useState<PessoaTurma[]>([]);
  const [pessoaDetalhes, setPessoaDetalhes] = useState<PessoaTurma | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string | null>(null);
  const [carregandoPessoas, setCarregandoPessoas] = useState(false);
  const [produtividadeRegistrada, setProdutividadeRegistrada] = useState<Record<string, boolean>>({});
  const [dataRegistroProdutividade, setDataRegistroProdutividade] = useState<string>('');

  useEffect(() => {
    buscarTodasPessoas();
    
    // Definir a data atual como data de registro
    const hoje = new Date().toISOString().split('T')[0];
    setDataRegistroProdutividade(hoje);
  }, []);

  const buscarPessoasPorTurma = useCallback(async (turmaId: string) => {
    try {
      setCarregandoPessoas(true);
      console.log('Buscando pessoas para a turma:', turmaId, 'usando função SQL...');
      
      // Usar a função SQL get_pessoas_turma que já traz o último registro
      const { data: pessoasData, error } = await supabase
        .rpc('get_pessoas_turma', { p_turma_id: turmaId });

      if (error) {
        console.error('Erro ao buscar pessoas da turma:', error);
        throw error;
      }

      // Converter os dados para PessoaTurma
      const pessoasFormatadas: PessoaTurma[] = pessoasData?.map(pessoa => ({
        id: pessoa.id,
        nome: pessoa.nome,
        email: pessoa.email || '',
        telefone: pessoa.telefone,
        turma_id: turmaId,
        active: true, // A view já filtra por active = true
        origem: pessoa.origem as 'aluno' | 'funcionario',
        cargo: pessoa.cargo,
        ultima_correcao_ah: null, // Não disponível na função atual
        data_ultimo_registro: pessoa.ultimo_registro_data,
        ultimo_registro_id: pessoa.ultimo_registro_id,
        codigo: null, // Não disponível na função atual
        ultimo_nivel: null, // Não disponível na função atual
        ultima_pagina: null, // Não disponível na função atual
        niveldesafio: null, // Não disponível na função atual
        data_onboarding: null, // Não disponível na função atual
        dias_supera: pessoa.dias_supera,
        idade: pessoa.idade
      })) || [];

      console.log('Pessoas carregadas da função SQL:', {
        total: pessoasFormatadas.length,
        porOrigem: pessoasFormatadas.reduce((acc, p) => {
          acc[p.origem] = (acc[p.origem] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });

      setPessoasTurma(pessoasFormatadas);

      // Buscar registros de produtividade para o dia atual
      const hoje = new Date().toISOString().split('T')[0];
      const pessoaIds = pessoasFormatadas.map(p => p.id);
      
      if (pessoaIds.length > 0) {
        const { data: registrosHoje } = await supabase
          .from('produtividade_abaco')
          .select('pessoa_id')
          .in('pessoa_id', pessoaIds)
          .eq('data_aula', hoje);

        const produtividadeMap: Record<string, boolean> = {};
        registrosHoje?.forEach(registro => {
          produtividadeMap[registro.pessoa_id] = true;
        });

        setProdutividadeRegistrada(produtividadeMap);
      }

      setDataRegistroProdutividade(hoje);

    } catch (error) {
      console.error('Erro ao buscar pessoas da turma:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de pessoas desta turma.",
        variant: "destructive"
      });
    } finally {
      setCarregandoPessoas(false);
    }
  }, []);

  const buscarTodasPessoas = async () => {
    try {
      setCarregando(true);
      
      // Buscar todos os alunos
      const { data: alunosData, error: alunosError } = await supabase
        .from('alunos')
        .select('*')
        .eq('active', true)
        .order('nome');

      if (alunosError) throw alunosError;
      
      // Buscar todos os funcionários
      const { data: funcionariosData, error: funcionariosError } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('active', true)
        .order('nome');
      
      if (funcionariosError) throw funcionariosError;
      
      // Converter alunos para o formato comum
      const alunosConvertidos: PessoaTurma[] = alunosData.map(aluno => ({
        ...aluno,
        origem: 'aluno' as const
      })) as PessoaTurma[];
      
      // Converter funcionários para o formato comum
      const funcionariosConvertidos: PessoaTurma[] = funcionariosData.map(funcionario => ({
        ...funcionario,
        origem: 'funcionario' as const
      })) as PessoaTurma[];
      
      // Combinar ambas as listas e ordenar por nome
      const todasPessoas = [...alunosConvertidos, ...funcionariosConvertidos].sort((a, b) => 
        a.nome.localeCompare(b.nome)
      );
      
      console.log(`Total encontrado: ${alunosData.length} alunos e ${funcionariosData.length} funcionários`);
      setTodasPessoas(todasPessoas);
      
    } catch (error) {
      console.error('Erro ao buscar todas as pessoas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista completa de pessoas.",
        variant: "destructive"
      });
    } finally {
      setCarregando(false);
    }
  };

  const mostrarDetalhesPessoa = (pessoa: PessoaTurma) => {
    setPessoaDetalhes(pessoa);
  };

  const fecharDetalhesPessoa = () => {
    setPessoaDetalhes(null);
  };

  const handleTurmaSelecionada = useCallback((turmaId: string) => {
    setTurmaSelecionada(turmaId);
    buscarPessoasPorTurma(turmaId);
  }, [buscarPessoasPorTurma]);

  const handleRegistrarPresenca = (pessoaId: string) => {
    // Implementação para registrar presença
    console.log('Registrando presença para:', pessoaId);
  };

  const voltarParaTurmas = () => {
    setTurmaSelecionada(null);
  };

  const atualizarProdutividadeRegistrada = (pessoaId: string, registrado: boolean) => {
    setProdutividadeRegistrada(prev => ({
      ...prev,
      [pessoaId]: registrado
    }));
    
    // Verificar se a data atual é diferente da data armazenada
    const hoje = new Date().toISOString().split('T')[0];
    if (hoje !== dataRegistroProdutividade) {
      setDataRegistroProdutividade(hoje);
    }
  };

  // Atualizar a lista depois de excluir um registro
  const recarregarDadosAposExclusao = (pessoaId: string) => {
    // Se temos uma turma selecionada, recarregar os dados dessa turma
    if (turmaSelecionada) {
      buscarPessoasPorTurma(turmaSelecionada);
    }
  };

  return {
    pessoasTurma,
    todasPessoas,
    pessoaDetalhes,
    carregando,
    turmaSelecionada,
    carregandoPessoas,
    produtividadeRegistrada,
    dataRegistroProdutividade,
    mostrarDetalhesPessoa,
    fecharDetalhesPessoa,
    handleTurmaSelecionada,
    handleRegistrarPresenca,
    voltarParaTurmas,
    atualizarProdutividadeRegistrada,
    buscarPessoasPorTurma,
    recarregarDadosAposExclusao
  };
}
