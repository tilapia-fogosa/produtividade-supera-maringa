
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
      
      // Primeiro, obter o unit_id da turma
      const { data: turmaData, error: turmaError } = await supabase
        .from('turmas')
        .select('unit_id')
        .eq('id', turmaId)
        .single();
      
      if (turmaError) throw turmaError;
      
      // Buscar alunos para esta turma
      const { data: alunosData, error: alunosError } = await supabase
        .from('alunos')
        .select('*')
        .eq('turma_id', turmaId)
        .eq('unit_id', turmaData.unit_id)
        .eq('active', true)
        .order('nome');

      if (alunosError) throw alunosError;
      
      // Buscar funcionários para esta turma
      const { data: funcionariosData, error: funcionariosError } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('turma_id', turmaId)
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
        unit_id: turmaData.unit_id, // Adicionamos o unit_id da turma para manter compatibilidade
        origem: 'funcionario' as const
      })) as PessoaTurma[];
      
      // Combinar ambas as listas
      const todasPessoas = [...alunosConvertidos, ...funcionariosConvertidos].sort((a, b) => 
        a.nome.localeCompare(b.nome)
      );
      
      console.log(`Encontrados ${alunosData.length} alunos e ${funcionariosData.length} funcionários para turma ${turmaId}`);
      
      // Buscar os últimos registros de produtividade de cada pessoa
      const pessoasIds = todasPessoas.map(pessoa => pessoa.id);
      
      // Buscar último registro de produtividade para cada pessoa (usando pessoa_id)
      const { data: ultimosRegistros, error: ultimosRegistrosError } = await supabase
        .from('produtividade_abaco')
        .select('id, pessoa_id, created_at, data_aula')
        .in('pessoa_id', pessoasIds)
        .order('created_at', { ascending: false });
        
      if (ultimosRegistrosError) throw ultimosRegistrosError;
      
      // Associar os últimos registros às pessoas
      if (ultimosRegistros && ultimosRegistros.length > 0) {
        // Criar um objeto com o último registro de cada pessoa
        const ultimosPorPessoa: Record<string, { id: string, created_at: string, data_aula: string }> = {};
        ultimosRegistros.forEach(registro => {
          if (!ultimosPorPessoa[registro.pessoa_id]) {
            ultimosPorPessoa[registro.pessoa_id] = {
              id: registro.id,
              created_at: registro.created_at,
              data_aula: registro.data_aula
            };
          }
        });
        
        // Adicionar informações do último registro a cada pessoa
        todasPessoas.forEach(pessoa => {
          const ultimoRegistro = ultimosPorPessoa[pessoa.id];
          if (ultimoRegistro) {
            pessoa.data_ultimo_registro = ultimoRegistro.data_aula;
            pessoa.ultimo_registro_id = ultimoRegistro.id;
          }
        });
      }
      
      setPessoasTurma(todasPessoas);
      
      // Verificar registros de produtividade para o dia atual (usando pessoa_id)
      const hoje = new Date().toISOString().split('T')[0];
      const { data: registrosData, error: registrosError } = await supabase
        .from('produtividade_abaco')
        .select('pessoa_id')
        .eq('data_aula', hoje);
        
      if (registrosError) throw registrosError;
      
      // Resetar o estado da produtividade registrada
      const novoEstado: Record<string, boolean> = {};
      if (registrosData && registrosData.length > 0) {
        registrosData.forEach(registro => {
          novoEstado[registro.pessoa_id] = true;
        });
      }
      
      setProdutividadeRegistrada(novoEstado);
      setDataRegistroProdutividade(hoje);
      
    } catch (error) {
      console.error('Erro ao buscar pessoas por turma:', error);
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
