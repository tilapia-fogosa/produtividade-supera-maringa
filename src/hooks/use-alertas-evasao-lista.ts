import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AlertaEvasao {
  id: string;
  aluno_id: string;
  data_alerta: string;
  origem_alerta: string;
  descritivo: string | null;
  responsavel: string | null;
  data_retencao: string | null;
  status: string;
  kanban_status: string;
  created_at: string;
  updated_at: string;
  aluno?: {
    nome: string;
    foto_url: string | null;
    active: boolean;
    turma_id: string | null;
    turma?: {
      nome: string;
      professor?: {
        nome: string;
      };
    };
  };
}

interface FiltrosAlertasEvasao {
  status?: string;
  data_inicio?: string;
  data_fim?: string;
  origem_alerta?: string;
  kanban_status?: string;
  nome_aluno?: string;
  page?: number;
  pageSize?: number;
}

export const useAlertasEvasaoLista = (filtros?: FiltrosAlertasEvasao) => {
  const page = filtros?.page || 1;
  const pageSize = filtros?.pageSize || 100;

  return useQuery({
    queryKey: ['alertas-evasao-lista', filtros],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Query principal com relacionamentos
      let query = supabase
        .from('alerta_evasao')
        .select(`
          *,
          aluno:alunos!inner(
            nome, 
            foto_url, 
            active,
            turma_id,
            turma:turmas(
              nome,
              professor:professores(nome)
            )
          )
        `, { count: 'exact' })
        .eq('aluno.active', true)
        .order('data_alerta', { ascending: false })
        .range(from, to);
      
      // Aplicar filtros
      if (filtros?.status) {
        query = query.eq('status', filtros.status as any);
      }
      
      if (filtros?.kanban_status) {
        query = query.eq('kanban_status', filtros.kanban_status as any);
      }
      
      if (filtros?.origem_alerta) {
        query = query.eq('origem_alerta', filtros.origem_alerta as any);
      }
      
      if (filtros?.data_inicio) {
        query = query.gte('data_alerta', filtros.data_inicio);
      }
      
      if (filtros?.data_fim) {
        query = query.lte('data_alerta', filtros.data_fim);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Erro ao buscar alertas de evasão:', error);
        throw error;
      }

      // Aplicar filtro de nome do aluno no lado do cliente
      let alertasFiltrados = data as AlertaEvasao[];
      if (filtros?.nome_aluno) {
        alertasFiltrados = alertasFiltrados.filter(alerta => 
          alerta.aluno?.nome.toLowerCase().includes(filtros.nome_aluno!.toLowerCase())
        );
      }
      
      // Buscar contagens com os mesmos filtros
      let countQuery = supabase
        .from('alerta_evasao')
        .select('*, alunos!inner(active)', { count: 'exact', head: true })
        .eq('alunos.active', true);
      
      if (filtros?.status) {
        countQuery = countQuery.eq('status', filtros.status as any);
      }
      
      if (filtros?.kanban_status) {
        countQuery = countQuery.eq('kanban_status', filtros.kanban_status as any);
      }
      
      if (filtros?.origem_alerta) {
        countQuery = countQuery.eq('origem_alerta', filtros.origem_alerta as any);
      }
      
      if (filtros?.data_inicio) {
        countQuery = countQuery.gte('data_alerta', filtros.data_inicio);
      }
      
      if (filtros?.data_fim) {
        countQuery = countQuery.lte('data_alerta', filtros.data_fim);
      }
      
      // Contagem de pendentes
      let pendentesQuery = supabase
        .from('alerta_evasao')
        .select('*, alunos!inner(active)', { count: 'exact', head: true })
        .eq('alunos.active', true)
        .eq('status', 'pendente');
      
      if (filtros?.data_inicio) {
        pendentesQuery = pendentesQuery.gte('data_alerta', filtros.data_inicio);
      }
      
      if (filtros?.data_fim) {
        pendentesQuery = pendentesQuery.lte('data_alerta', filtros.data_fim);
      }
      
      if (filtros?.origem_alerta) {
        pendentesQuery = pendentesQuery.eq('origem_alerta', filtros.origem_alerta as any);
      }
      
      // Contagem de resolvidos
      let resolvidosQuery = supabase
        .from('alerta_evasao')
        .select('*, alunos!inner(active)', { count: 'exact', head: true })
        .eq('alunos.active', true)
        .eq('status', 'resolvido');
      
      if (filtros?.data_inicio) {
        resolvidosQuery = resolvidosQuery.gte('data_alerta', filtros.data_inicio);
      }
      
      if (filtros?.data_fim) {
        resolvidosQuery = resolvidosQuery.lte('data_alerta', filtros.data_fim);
      }
      
      if (filtros?.origem_alerta) {
        resolvidosQuery = resolvidosQuery.eq('origem_alerta', filtros.origem_alerta as any);
      }
      
      // Contagem de em andamento
      let emAndamentoQuery = supabase
        .from('alerta_evasao')
        .select('*, alunos!inner(active)', { count: 'exact', head: true })
        .eq('alunos.active', true)
        .eq('kanban_status', 'in_progress');
      
      if (filtros?.data_inicio) {
        emAndamentoQuery = emAndamentoQuery.gte('data_alerta', filtros.data_inicio);
      }
      
      if (filtros?.data_fim) {
        emAndamentoQuery = emAndamentoQuery.lte('data_alerta', filtros.data_fim);
      }
      
      if (filtros?.origem_alerta) {
        emAndamentoQuery = emAndamentoQuery.eq('origem_alerta', filtros.origem_alerta as any);
      }

      const [
        { count: totalCount },
        { count: pendentesCount },
        { count: resolvidosCount },
        { count: emAndamentoCount }
      ] = await Promise.all([
        countQuery,
        pendentesQuery,
        resolvidosQuery,
        emAndamentoQuery
      ]);

      const totalPages = count ? Math.ceil(count / pageSize) : 0;

      return {
        alertas: alertasFiltrados,
        total: count || 0,
        totalPendentes: pendentesCount || 0,
        totalResolvidos: resolvidosCount || 0,
        totalEmAndamento: emAndamentoCount || 0,
        page,
        pageSize,
        totalPages
      };
    }
  });
};
