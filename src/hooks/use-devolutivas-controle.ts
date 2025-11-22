import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveUnit } from '@/contexts/ActiveUnitContext';

export interface DevolutivaControleItem {
  id: string;
  pessoa_id: string;
  tipo_pessoa: 'aluno' | 'funcionario';
  nome: string;
  turma_nome: string | null;
  professor_nome: string | null;
  foto_escolhida: boolean;
  impresso: boolean;
  entregue: boolean;
  impresso_em: string | null;
  entregue_em: string | null;
  impresso_por_nome: string | null;
  entregue_por_nome: string | null;
  pdf_devolutiva_url: string | null;
}

type OrdenacaoCampo = 'nome' | 'turma_nome' | 'professor_nome' | 'foto_escolhida' | 'impresso' | 'entregue' | 'pdf_devolutiva_url';
type OrdenacaoDirecao = 'asc' | 'desc';

export function useDevolutivasControle() {
  const { activeUnit } = useActiveUnit();
  const [devolutivas, setDevolutivas] = useState<DevolutivaControleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroProfessor, setFiltroProfessor] = useState<string | null>(null);
  const [filtroTurma, setFiltroTurma] = useState<string | null>(null);
  const [ordenacaoCampo, setOrdenacaoCampo] = useState<OrdenacaoCampo>('nome');
  const [ordenacaoDirecao, setOrdenacaoDirecao] = useState<OrdenacaoDirecao>('asc');

  const fetchDevolutivas = async () => {
    if (!activeUnit) return;

    try {
      setLoading(true);

      // Buscar dados de alunos
      const { data: alunosData, error: alunosError } = await supabase
        .from('alunos')
        .select(`
          id,
          nome,
          foto_devolutiva_url,
          pdf_devolutiva_url,
          turma_id,
          unit_id,
          turmas (
            nome,
            professor_id,
            professores (nome)
          )
        `)
        .eq('active', true)
        .eq('unit_id', activeUnit.id);

      if (alunosError) throw alunosError;

      // Buscar dados de funcionários
      const { data: funcionariosData, error: funcionariosError } = await supabase
        .from('funcionarios')
        .select(`
          id,
          nome,
          foto_devolutiva_url,
          pdf_devolutiva_url,
          turma_id,
          unit_id,
          turmas (
            nome,
            professor_id,
            professores (nome)
          )
        `)
        .eq('active', true)
        .eq('unit_id', activeUnit.id);

      if (funcionariosError) throw funcionariosError;

      // Buscar controles existentes
      const { data: controlesData, error: controlesError } = await supabase
        .from('devolutivas_controle')
        .select('*')
        .eq('unit_id', activeUnit.id);

      if (controlesError) throw controlesError;

      // Buscar nomes dos usuários que imprimiram/entregaram (apenas se houver usuário)
      const userIds = new Set<string>();
      (controlesData || []).forEach(c => {
        if (c.impresso_por) userIds.add(c.impresso_por);
        if (c.entregue_por) userIds.add(c.entregue_por);
      });

      let profilesMap = new Map<string, string>();
      
      if (userIds.size > 0) {
        try {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', Array.from(userIds));
          
          profilesMap = new Map(
            (profilesData || []).map(p => [p.id, p.full_name])
          );
        } catch (error) {
          console.warn('Não foi possível buscar perfis:', error);
        }
      }

      // Mapear controles por pessoa_id + tipo_pessoa
      const controlesMap = new Map(
        (controlesData || []).map(c => [`${c.pessoa_id}_${c.tipo_pessoa}`, c])
      );

      // Processar alunos
      const alunosProcessados = (alunosData || []).map(aluno => {
        const key = `${aluno.id}_aluno`;
        const controle = controlesMap.get(key);
        const turma = aluno.turmas as any;
        
        return {
          id: controle?.id || '',
          pessoa_id: aluno.id,
          tipo_pessoa: 'aluno' as const,
          nome: aluno.nome,
          turma_nome: turma?.nome || null,
          professor_nome: turma?.professores?.nome || null,
          foto_escolhida: !!aluno.foto_devolutiva_url,
          impresso: controle?.impresso || false,
          entregue: controle?.entregue || false,
          impresso_em: controle?.impresso_em || null,
          entregue_em: controle?.entregue_em || null,
          impresso_por_nome: controle?.impresso_por ? profilesMap.get(controle.impresso_por) || null : null,
          entregue_por_nome: controle?.entregue_por ? profilesMap.get(controle.entregue_por) || null : null,
          pdf_devolutiva_url: aluno.pdf_devolutiva_url || null,
        };
      });

      // Processar funcionários
      const funcionariosProcessados = (funcionariosData || []).map(funcionario => {
        const key = `${funcionario.id}_funcionario`;
        const controle = controlesMap.get(key);
        const turma = funcionario.turmas as any;
        
        return {
          id: controle?.id || '',
          pessoa_id: funcionario.id,
          tipo_pessoa: 'funcionario' as const,
          nome: funcionario.nome,
          turma_nome: turma?.nome || 'Sem turma',
          professor_nome: turma?.professores?.nome || null,
          foto_escolhida: !!funcionario.foto_devolutiva_url,
          impresso: controle?.impresso || false,
          entregue: controle?.entregue || false,
          impresso_em: controle?.impresso_em || null,
          entregue_em: controle?.entregue_em || null,
          impresso_por_nome: controle?.impresso_por ? profilesMap.get(controle.impresso_por) || null : null,
          entregue_por_nome: controle?.entregue_por ? profilesMap.get(controle.entregue_por) || null : null,
          pdf_devolutiva_url: funcionario.pdf_devolutiva_url || null,
        };
      });

      const todosDevolutivas = [...alunosProcessados, ...funcionariosProcessados]
        .sort((a, b) => a.nome.localeCompare(b.nome));

      setDevolutivas(todosDevolutivas);
    } catch (error) {
      console.error('Erro ao buscar devolutivas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevolutivas();
  }, [activeUnit]);

  const atualizarStatus = async (
    pessoaId: string,
    tipoPessoa: 'aluno' | 'funcionario',
    campo: 'impresso' | 'entregue',
    valor: boolean
  ) => {
    if (!activeUnit) return false;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      const updateData: any = {
        [campo]: valor,
        [`${campo}_em`]: valor ? new Date().toISOString() : null,
        [`${campo}_por`]: valor ? user.user.id : null,
      };

      // Tentar atualizar, se não existir, inserir
      const { error: updateError } = await supabase
        .from('devolutivas_controle')
        .update(updateData)
        .eq('pessoa_id', pessoaId)
        .eq('tipo_pessoa', tipoPessoa);

      if (updateError) {
        // Se não existe, criar
        const { error: insertError } = await supabase
          .from('devolutivas_controle')
          .insert({
            pessoa_id: pessoaId,
            tipo_pessoa: tipoPessoa,
            unit_id: activeUnit.id,
            ...updateData,
          });

        if (insertError) throw insertError;
      }

      await fetchDevolutivas();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return false;
    }
  };

  // Aplicar filtros
  const devolutivasFiltradas = devolutivas.filter(dev => {
    if (filtroNome && !dev.nome.toLowerCase().includes(filtroNome.toLowerCase())) {
      return false;
    }
    if (filtroProfessor && dev.professor_nome !== filtroProfessor) {
      return false;
    }
    if (filtroTurma && dev.turma_nome !== filtroTurma) {
      return false;
    }
    return true;
  });

  // Aplicar ordenação
  const devolutivasOrdenadas = [...devolutivasFiltradas].sort((a, b) => {
    let comparacao = 0;

    if (ordenacaoCampo === 'foto_escolhida' || ordenacaoCampo === 'impresso' || ordenacaoCampo === 'entregue') {
      comparacao = Number(a[ordenacaoCampo]) - Number(b[ordenacaoCampo]);
    } else if (ordenacaoCampo === 'pdf_devolutiva_url') {
      const aTemPdf = !!a.pdf_devolutiva_url;
      const bTemPdf = !!b.pdf_devolutiva_url;
      comparacao = Number(aTemPdf) - Number(bTemPdf);
    } else {
      const valorA = a[ordenacaoCampo] || '';
      const valorB = b[ordenacaoCampo] || '';
      comparacao = String(valorA).localeCompare(String(valorB));
    }

    return ordenacaoDirecao === 'asc' ? comparacao : -comparacao;
  });

  const toggleOrdenacao = (campo: OrdenacaoCampo) => {
    if (ordenacaoCampo === campo) {
      setOrdenacaoDirecao(ordenacaoDirecao === 'asc' ? 'desc' : 'asc');
    } else {
      setOrdenacaoCampo(campo);
      setOrdenacaoDirecao('asc');
    }
  };

  // Estatísticas
  const stats = {
    total: devolutivasFiltradas.length,
    fotosEscolhidas: devolutivasFiltradas.filter(d => d.foto_escolhida).length,
    impressos: devolutivasFiltradas.filter(d => d.impresso).length,
    entregues: devolutivasFiltradas.filter(d => d.entregue).length,
  };

  // Listas únicas para filtros
  const professoresUnicos = Array.from(
    new Set(devolutivas.map(d => d.professor_nome).filter(Boolean))
  ).sort();

  const turmasUnicas = Array.from(
    new Set(devolutivas.map(d => d.turma_nome).filter(Boolean))
  ).sort();

  return {
    devolutivas: devolutivasOrdenadas,
    loading,
    stats,
    professoresUnicos,
    turmasUnicas,
    filtroNome,
    setFiltroNome,
    filtroProfessor,
    setFiltroProfessor,
    filtroTurma,
    setFiltroTurma,
    atualizarStatus,
    refetch: fetchDevolutivas,
    ordenacaoCampo,
    ordenacaoDirecao,
    toggleOrdenacao,
  };
}
