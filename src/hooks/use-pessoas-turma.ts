
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';

export interface PessoaTurma {
  id: string;
  nome: string;
  origem: 'aluno' | 'funcionario';
  ultima_pagina?: string | null;
  ultimo_nivel?: string | null;
  data_ultimo_registro?: string | null;
  ultimo_registro_id?: string | null;
}

interface UsePessoasTurmaReturn {
  pessoasTurma: PessoaTurma[];
  todasPessoas: PessoaTurma[];
  produtividadeRegistrada: Record<string, boolean>;
  dataRegistroProdutividade: string;
  carregandoPessoas: boolean;
  atualizarProdutividadeRegistrada: (pessoaId: string, registrada: boolean) => void;
  buscarPessoasPorTurma: (turmaId: string) => Promise<void>;
  recarregarDadosAposExclusao: (pessoaId: string) => void;
}

export const usePessoasTurma = (): UsePessoasTurmaReturn => {
  const [pessoasTurma, setPessoasTurma] = useState<PessoaTurma[]>([]);
  const [todasPessoas, setTodasPessoas] = useState<PessoaTurma[]>([]);
  const [produtividadeRegistrada, setProdutividadeRegistrada] = useState<Record<string, boolean>>({});
  const [dataRegistroProdutividade, setDataRegistroProdutividade] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [carregandoPessoas, setCarregandoPessoas] = useState(false);

  const buscarPessoasPorTurma = useCallback(async (turmaId: string) => {
    try {
      setCarregandoPessoas(true);
      console.log('Buscando pessoas para turma:', turmaId);

      // Buscar alunos da turma
      const { data: alunos, error: alunosError } = await supabase
        .from('alunos')
        .select('id, nome, ultimo_nivel, ultima_pagina')
        .eq('turma_id', turmaId)
        .eq('active', true);

      if (alunosError) {
        console.error('Erro ao buscar alunos:', alunosError);
        throw alunosError;
      }

      // Buscar funcionários da turma
      const { data: funcionarios, error: funcionariosError } = await supabase
        .from('funcionarios')
        .select('id, nome, ultimo_nivel, ultima_pagina')
        .eq('turma_id', turmaId)
        .eq('active', true);

      if (funcionariosError) {
        console.error('Erro ao buscar funcionários:', funcionariosError);
        throw funcionariosError;
      }

      // Combinar alunos e funcionários
      const todasAsPessoas: PessoaTurma[] = [
        ...(alunos || []).map(aluno => ({
          id: aluno.id,
          nome: aluno.nome,
          origem: 'aluno' as const,
          ultima_pagina: aluno.ultima_pagina?.toString() || null,
          ultimo_nivel: aluno.ultimo_nivel
        })),
        ...(funcionarios || []).map(funcionario => ({
          id: funcionario.id,
          nome: funcionario.nome,
          origem: 'funcionario' as const,
          ultima_pagina: funcionario.ultima_pagina?.toString() || null,
          ultimo_nivel: funcionario.ultimo_nivel
        }))
      ];

      console.log('Pessoas encontradas:', todasAsPessoas.length);

      // Buscar dados de produtividade para cada pessoa
      const pessoasComRegistros = await Promise.all(
        todasAsPessoas.map(async (pessoa) => {
          try {
            // Buscar último registro de produtividade
            const { data: ultimoRegistro } = await supabase
              .from('produtividade_abaco')
              .select('id, data_aula, apostila, pagina')
              .eq('pessoa_id', pessoa.id)
              .order('data_aula', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Verificar se tem produtividade registrada hoje
            const hoje = format(new Date(), 'yyyy-MM-dd');
            const { data: registroHoje } = await supabase
              .from('produtividade_abaco')
              .select('id')
              .eq('pessoa_id', pessoa.id)
              .eq('data_aula', hoje)
              .maybeSingle();

            return {
              ...pessoa,
              data_ultimo_registro: ultimoRegistro?.data_aula || null,
              ultimo_registro_id: ultimoRegistro?.id || null,
              // Atualizar com dados do último registro se disponível
              ultima_pagina: ultimoRegistro?.pagina || pessoa.ultima_pagina,
              ultimo_nivel: ultimoRegistro?.apostila || pessoa.ultimo_nivel,
              temRegistroHoje: !!registroHoje
            };
          } catch (error) {
            console.error(`Erro ao buscar produtividade para ${pessoa.nome}:`, error);
            return {
              ...pessoa,
              temRegistroHoje: false
            };
          }
        })
      );

      // Atualizar estado
      setPessoasTurma(pessoasComRegistros);
      setTodasPessoas(pessoasComRegistros);

      // Atualizar produtividade registrada
      const novoRegistrosProdutividade: Record<string, boolean> = {};
      pessoasComRegistros.forEach((pessoa: any) => {
        novoRegistrosProdutividade[pessoa.id] = pessoa.temRegistroHoje;
      });
      setProdutividadeRegistrada(novoRegistrosProdutividade);

      console.log('Produtividade registrada:', novoRegistrosProdutividade);

    } catch (error) {
      console.error('Erro ao buscar pessoas da turma:', error);
    } finally {
      setCarregandoPessoas(false);
    }
  }, []);

  const atualizarProdutividadeRegistrada = useCallback((pessoaId: string, registrada: boolean) => {
    setProdutividadeRegistrada(prev => ({
      ...prev,
      [pessoaId]: registrada
    }));
  }, []);

  const recarregarDadosAposExclusao = useCallback((pessoaId: string) => {
    console.log('Recarregando dados após exclusão para pessoa:', pessoaId);
    
    // Atualizar estado local primeiro
    setProdutividadeRegistrada(prev => ({
      ...prev,
      [pessoaId]: false
    }));

    // Recarregar dados da pessoa específica
    const atualizarPessoa = async () => {
      try {
        // Buscar último registro atualizado
        const { data: ultimoRegistro } = await supabase
          .from('produtividade_abaco')
          .select('id, data_aula, apostila, pagina')
          .eq('pessoa_id', pessoaId)
          .order('data_aula', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Atualizar a pessoa na lista
        setPessoasTurma(prev => prev.map(pessoa => {
          if (pessoa.id === pessoaId) {
            return {
              ...pessoa,
              data_ultimo_registro: ultimoRegistro?.data_aula || null,
              ultimo_registro_id: ultimoRegistro?.id || null,
              ultima_pagina: ultimoRegistro?.pagina || pessoa.ultima_pagina,
              ultimo_nivel: ultimoRegistro?.apostila || pessoa.ultimo_nivel
            };
          }
          return pessoa;
        }));

        setTodasPessoas(prev => prev.map(pessoa => {
          if (pessoa.id === pessoaId) {
            return {
              ...pessoa,
              data_ultimo_registro: ultimoRegistro?.data_aula || null,
              ultimo_registro_id: ultimoRegistro?.id || null,
              ultima_pagina: ultimoRegistro?.pagina || pessoa.ultima_pagina,
              ultimo_nivel: ultimoRegistro?.apostila || pessoa.ultimo_nivel
            };
          }
          return pessoa;
        }));

      } catch (error) {
        console.error('Erro ao recarregar dados da pessoa:', error);
      }
    };

    atualizarPessoa();
  }, []);

  return {
    pessoasTurma,
    todasPessoas,
    produtividadeRegistrada,
    dataRegistroProdutividade,
    carregandoPessoas,
    atualizarProdutividadeRegistrada,
    buscarPessoasPorTurma,
    recarregarDadosAposExclusao
  };
};
