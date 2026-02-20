
import { useState, useCallback, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';

export interface SalaPessoaTurma {
  id: string;
  nome: string;
  turma_id: string | null;
  origem: 'aluno' | 'funcionario';
  telefone?: string | null;
  email?: string | null;
  ultima_pagina?: number | null;
  ultimo_nivel?: string | null;
  dias_supera?: number | null;
  produtividadeRegistrada?: boolean;
  foto_url?: string | null;
  faltas_consecutivas?: number | null;
  niveldesafio?: string | null;
}

export function useSalaPessoasTurma() {
  const [pessoasTurma, setPessoasTurma] = useState<SalaPessoaTurma[]>([]);
  const [loading, setLoading] = useState(false);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string | null>(null);
  const [dataAtual, setDataAtual] = useState<string>('');

  useEffect(() => {
    setDataAtual(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  const buscarPessoasPorTurma = useCallback(async (turmaId: string, data?: Date) => {
    if (!turmaId) return;
    
    setLoading(true);
    setTurmaSelecionada(turmaId);
    
    try {
      console.log('[Sala] Buscando pessoas da turma:', turmaId);
      
      // Buscar alunos ativos da turma
      const { data: alunos, error: alunosError } = await supabase
        .from('alunos')
        .select('id, nome, turma_id, telefone, email, ultima_pagina, ultimo_nivel, dias_supera, foto_url, faltas_consecutivas, niveldesafio')
        .eq('turma_id', turmaId)
        .eq('active', true)
        .order('nome');

      if (alunosError) {
        console.error('[Sala] Erro ao buscar alunos:', alunosError);
        return;
      }

      // Buscar funcionários ativos da turma
      const { data: funcionarios, error: funcError } = await supabase
        .from('funcionarios')
        .select('id, nome, turma_id, telefone, email')
        .eq('turma_id', turmaId)
        .eq('active', true)
        .order('nome');

      if (funcError) {
        console.error('[Sala] Erro ao buscar funcionários:', funcError);
      }

      // Combinar alunos e funcionários
      const pessoas: SalaPessoaTurma[] = [
        ...(alunos || []).map(a => ({ ...a, origem: 'aluno' as const })),
        ...(funcionarios || []).map(f => ({ ...f, origem: 'funcionario' as const, ultima_pagina: null, ultimo_nivel: null, dias_supera: null, foto_url: null }))
      ];

      // Usar a data fornecida ou hoje
      const dataConsulta = data ? format(data, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      const pessoaIds = pessoas.map(p => p.id);
      
      if (pessoaIds.length > 0) {
        const { data: produtividades } = await supabase
          .from('produtividade_abaco')
          .select('pessoa_id')
          .in('pessoa_id', pessoaIds)
          .eq('data_aula', dataConsulta);

        const idsComProdutividade = new Set(produtividades?.map(p => p.pessoa_id) || []);
        
        pessoas.forEach(pessoa => {
          pessoa.produtividadeRegistrada = idsComProdutividade.has(pessoa.id);
        });
      }

      console.log('[Sala] Pessoas encontradas:', pessoas.length);
      setPessoasTurma(pessoas);
    } catch (error) {
      console.error('[Sala] Erro ao buscar pessoas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const atualizarProdutividadeRegistrada = useCallback((pessoaId: string, registrado: boolean) => {
    setPessoasTurma(prev => 
      prev.map(p => p.id === pessoaId ? { ...p, produtividadeRegistrada: registrado } : p)
    );
  }, []);

  const recarregarDadosAposExclusao = useCallback(async (pessoaId: string) => {
    if (!turmaSelecionada) return;
    
    // Marcar como não registrado localmente
    atualizarProdutividadeRegistrada(pessoaId, false);
  }, [turmaSelecionada, atualizarProdutividadeRegistrada]);

  return {
    pessoasTurma,
    loading,
    turmaSelecionada,
    dataAtual,
    buscarPessoasPorTurma,
    atualizarProdutividadeRegistrada,
    recarregarDadosAposExclusao
  };
}
