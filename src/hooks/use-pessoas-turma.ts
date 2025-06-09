
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';

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
  ultima_pagina?: number | null; // Padronizado como number | null
  niveldesafio?: string;
  ultima_correcao_ah?: string;
  data_onboarding?: string | null;
  cargo?: string | null;
  // Campos para último registro
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
        .select('*')
        .eq('turma_id', turmaId)
        .eq('active', true);

      if (alunosError) {
        console.error('Erro ao buscar alunos:', alunosError);
        throw alunosError;
      }

      // Buscar funcionários da turma
      const { data: funcionarios, error: funcionariosError } = await supabase
        .from('funcionarios')
        .select('*')
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
          email: aluno.email,
          telefone: aluno.telefone,
          turma_id: aluno.turma_id,
          active: aluno.active,
          origem: 'aluno' as const,
          unit_id: aluno.unit_id,
          codigo: aluno.codigo,
          ultimo_nivel: aluno.ultimo_nivel,
          ultima_pagina: aluno.ultima_pagina, // Já é number | null no banco
          niveldesafio: aluno.niveldesafio,
          ultima_correcao_ah: aluno.ultima_correcao_ah,
          data_onboarding: aluno.data_onboarding,
          cargo: null
        })),
        ...(funcionarios || []).map(funcionario => ({
          id: funcionario.id,
          nome: funcionario.nome,
          email: funcionario.email,
          telefone: funcionario.telefone,
          turma_id: funcionario.turma_id,
          active: funcionario.active,
          origem: 'funcionario' as const,
          unit_id: funcionario.unit_id,
          codigo: funcionario.codigo,
          ultimo_nivel: funcionario.ultimo_nivel,
          ultima_pagina: funcionario.ultima_pagina, // Já é number | null no banco
          niveldesafio: funcionario.niveldesafio,
          ultima_correcao_ah: funcionario.ultima_correcao_ah,
          data_onboarding: funcionario.data_onboarding,
          cargo: funcionario.cargo
        }))
      ];

      console.log('Pessoas encontradas:', todasAsPessoas.length);

      // Buscar dados de produtividade para cada pessoa
      const pessoasComRegistros = await Promise.all(
        todasAsPessoas.map(async (pessoa) => {
          try {
            console.log(`Buscando produtividade para pessoa ${pessoa.nome} (${pessoa.id})`);
            
            // Buscar último registro de produtividade usando pessoa_id
            const { data: ultimoRegistro, error: registroError } = await supabase
              .from('produtividade_abaco')
              .select('id, data_aula, apostila, pagina, created_at')
              .eq('pessoa_id', pessoa.id)
              .order('data_aula', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (registroError) {
              console.error(`Erro ao buscar último registro para ${pessoa.nome}:`, registroError);
            }

            // Verificar se tem produtividade registrada hoje
            const hoje = format(new Date(), 'yyyy-MM-dd');
            const { data: registroHoje, error: hojeError } = await supabase
              .from('produtividade_abaco')
              .select('id')
              .eq('pessoa_id', pessoa.id)
              .eq('data_aula', hoje)
              .maybeSingle();

            if (hojeError) {
              console.error(`Erro ao verificar registro de hoje para ${pessoa.nome}:`, hojeError);
            }

            console.log(`Último registro para ${pessoa.nome}:`, ultimoRegistro);
            console.log(`Registro hoje para ${pessoa.nome}:`, !!registroHoje);

            return {
              ...pessoa,
              data_ultimo_registro: ultimoRegistro?.data_aula || null,
              ultimo_registro_id: ultimoRegistro?.id || null,
              // Atualizar com dados do último registro se disponível
              ultima_pagina: ultimoRegistro?.pagina ? parseInt(ultimoRegistro.pagina) : pessoa.ultima_pagina,
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
        // Buscar último registro atualizado usando pessoa_id
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
              ultima_pagina: ultimoRegistro?.pagina ? parseInt(ultimoRegistro.pagina) : pessoa.ultima_pagina,
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
              ultima_pagina: ultimoRegistro?.pagina ? parseInt(ultimoRegistro.pagina) : pessoa.ultima_pagina,
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
