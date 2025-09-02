import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AlunoRetencao {
  id: string;
  nome: string;
  turma: string;
  educador: string;
  totalAlertas: number;
  alertasAtivos: number;
  totalRetencoes: number;
  ultimoAlerta: string | null;
  ultimaRetencao: string | null;
  status: 'critico' | 'alerta' | 'retencao' | 'normal';
  dadosAulaZero?: any;
}

interface RetencoesHistoricoParams {
  searchTerm: string;
  statusFilter: string;
}

interface Totals {
  totalAlunos: number;
  alertasAtivos: number;
  comRetencoes: number;
  criticos: number;
}

export function useRetencoesHistorico({ searchTerm, statusFilter }: RetencoesHistoricoParams) {
  const [alunos, setAlunos] = useState<AlunoRetencao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<Totals>({
    totalAlunos: 0,
    alertasAtivos: 0,
    comRetencoes: 0,
    criticos: 0
  });

  const fetchAlunosComHistorico = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar alunos que têm alertas de evasão ou retenções
      let query = supabase
        .from('alunos')
        .select(`
          id,
          nome,
          turmas!inner(
            nome,
            professores(nome)
          )
        `)
        .eq('active', true);

      // Aplicar filtro de busca
      if (searchTerm) {
        query = query.ilike('nome', `%${searchTerm}%`);
      }

      const { data: alunosData, error: alunosError } = await query;

      if (alunosError) {
        console.error('Erro ao buscar alunos:', alunosError);
        setError(alunosError.message);
        return;
      }

      // Para cada aluno, buscar alertas e retenções
      const alunosComHistorico: AlunoRetencao[] = [];

      for (const aluno of alunosData || []) {
        // Buscar alertas
        const { data: alertas } = await supabase
          .from('alerta_evasao')
          .select('*')
          .eq('aluno_id', aluno.id)
          .order('created_at', { ascending: false });

        // Buscar retenções
        const { data: retencoes } = await supabase
          .from('retencoes')
          .select('*')
          .eq('aluno_id', aluno.id)
          .order('created_at', { ascending: false });

        const totalAlertas = alertas?.length || 0;
        const alertasAtivos = alertas?.filter(a => a.status === 'pendente').length || 0;
        const totalRetencoes = retencoes?.length || 0;

        const ultimoAlerta = alertas?.[0]?.created_at || null;
        const ultimaRetencao = retencoes?.[0]?.created_at || null;

        // Determinar status
        let status: 'critico' | 'alerta' | 'retencao' | 'normal' = 'normal';
        if (alertasAtivos >= 2) {
          status = 'critico';
        } else if (alertasAtivos > 0) {
          status = 'alerta';
        } else if (totalRetencoes > 0) {
          status = 'retencao';
        }

        // Aplicar filtro de status
        const shouldInclude = statusFilter === 'todos' ||
          (statusFilter === 'alertas-ativos' && alertasAtivos > 0) ||
          (statusFilter === 'com-retencoes' && totalRetencoes > 0) ||
          (statusFilter === 'criticos' && status === 'critico');

        if (shouldInclude && (totalAlertas > 0 || totalRetencoes > 0)) {
          alunosComHistorico.push({
            id: aluno.id,
            nome: aluno.nome,
            turma: aluno.turmas?.nome || 'Sem turma',
            educador: aluno.turmas?.professores?.nome || 'Sem professor',
            totalAlertas,
            alertasAtivos,
            totalRetencoes,
            ultimoAlerta,
            ultimaRetencao,
            status
          });
        }
      }

      setAlunos(alunosComHistorico);
      
      // Calcular totais
      const totalAlunos = alunosComHistorico.length;
      const alertasAtivosCount = alunosComHistorico.filter(a => a.alertasAtivos > 0).length;
      const comRetencoesCount = alunosComHistorico.filter(a => a.totalRetencoes > 0).length;
      const criticosCount = alunosComHistorico.filter(a => a.status === 'critico').length;

      setTotals({
        totalAlunos,
        alertasAtivos: alertasAtivosCount,
        comRetencoes: comRetencoesCount,
        criticos: criticosCount
      });
    } catch (err) {
      console.error('Erro ao buscar alunos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar histórico detalhado de um aluno específico
  const fetchHistoricoAluno = async (alunoId: string) => {
    try {
      // Buscar alertas
      const { data: alertas, error: alertasError } = await supabase
        .from('alerta_evasao')
        .select('*')
        .eq('aluno_id', alunoId)
        .order('created_at', { ascending: false });

      if (alertasError) {
        console.error('Erro ao buscar alertas:', alertasError);
        throw new Error(alertasError.message);
      }

      // Buscar retenções
      const { data: retencoes, error: retencoesError } = await supabase
        .from('retencoes')
        .select('*')
        .eq('aluno_id', alunoId)
        .order('created_at', { ascending: false });

      if (retencoesError) {
        console.error('Erro ao buscar retenções:', retencoesError);
        throw new Error(retencoesError.message);
      }

      // Buscar dados da aula zero (na tabela alunos)
      const { data: alunoData, error: alunoError } = await supabase
        .from('alunos')
        .select(`
          motivo_procura,
          percepcao_coordenador,
          avaliacao_abaco,
          avaliacao_ah,
          pontos_atencao,
          coordenador_responsavel
        `)
        .eq('id', alunoId)
        .single();

      if (alunoError) {
        console.error('Erro ao buscar dados do aluno:', alunoError);
        throw new Error(alunoError.message);
      }

      return {
        alertas: alertas || [],
        retencoes: retencoes || [],
        aulaZero: alunoData
      };
    } catch (err) {
      console.error('Erro ao buscar histórico do aluno:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAlunosComHistorico();
  }, [searchTerm, statusFilter]);

  return {
    alunos,
    loading,
    error,
    totals,
    refetch: fetchAlunosComHistorico,
    fetchHistoricoAluno
  };
}