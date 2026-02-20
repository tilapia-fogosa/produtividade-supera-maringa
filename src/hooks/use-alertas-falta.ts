import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AlertaFalta {
  id: string;
  aluno_id: string;
  turma_id: string | null;
  professor_id: string | null;
  unit_id: string | null;
  data_alerta: string;
  data_falta: string;
  tipo_criterio: string;
  detalhes: any;
  status: string;
  resolvido_por: string | null;
  resolvido_em: string | null;
  slack_mensagem_id: string | null;
  slack_enviado: boolean;
  slack_erro: string | null;
  slack_enviado_em: string | null;
  created_at: string;
  updated_at: string;
  aluno?: {
    nome: string;
    foto_url: string | null;
  };
  turma?: {
    nome: string;
  };
  professor?: {
    nome: string;
    slack_username: string | null;
  };
  unit?: {
    name: string;
  };
}

interface FiltrosAlertasFalta {
  status?: string;
  data_inicio?: string;
  data_fim?: string;
  tipo_criterio?: string;
  unit_id?: string;
  nome_aluno?: string;
  turma_id?: string;
  professor_id?: string;
  page?: number;
  pageSize?: number;
}

export function useAlertasFalta(filtros?: FiltrosAlertasFalta) {
  return useQuery({
    queryKey: ['alertas-falta', filtros],
    queryFn: async () => {
      const page = filtros?.page || 1;
      const pageSize = filtros?.pageSize || 100;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('alertas_falta')
        .select(`
          *,
          aluno:alunos!inner(nome, foto_url, active),
          turma:turmas(nome),
          professor:professores(nome, slack_username),
          unit:units(name)
        `, { count: 'exact' })
        .eq('aluno.active', true)
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (filtros?.status) {
        query = query.eq('status', filtros.status);
      }
      
      if (filtros?.data_inicio) {
        query = query.gte('created_at', filtros.data_inicio);
      }
      
      if (filtros?.data_fim) {
        query = query.lte('created_at', filtros.data_fim);
      }
      
      if (filtros?.tipo_criterio) {
        query = query.eq('tipo_criterio', filtros.tipo_criterio);
      }
      
      if (filtros?.unit_id) {
        query = query.eq('unit_id', filtros.unit_id);
      }
      
      if (filtros?.turma_id) {
        query = query.eq('turma_id', filtros.turma_id);
      }
      
      if (filtros?.professor_id) {
        query = query.eq('professor_id', filtros.professor_id);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Erro ao buscar alertas de falta:', error);
        throw error;
      }

      // Aplicar filtro de nome do aluno no lado do cliente
      let alertasFiltrados = data as AlertaFalta[];
      if (filtros?.nome_aluno) {
        alertasFiltrados = alertasFiltrados.filter(alerta => 
          alerta.aluno?.nome.toLowerCase().includes(filtros.nome_aluno.toLowerCase())
        );
      }
      
      // Buscar contagens de cada status com os mesmos filtros
      let countQuery = supabase
        .from('alertas_falta')
        .select('*, alunos!inner(active)', { count: 'exact', head: true })
        .eq('alunos.active', true);
      
      if (filtros?.status) {
        countQuery = countQuery.eq('status', filtros.status);
      }
      if (filtros?.data_inicio) {
        countQuery = countQuery.gte('created_at', filtros.data_inicio);
      }
      if (filtros?.data_fim) {
        countQuery = countQuery.lte('created_at', filtros.data_fim);
      }
      if (filtros?.tipo_criterio) {
        countQuery = countQuery.eq('tipo_criterio', filtros.tipo_criterio);
      }
      if (filtros?.unit_id) {
        countQuery = countQuery.eq('unit_id', filtros.unit_id);
      }
      if (filtros?.turma_id) {
        countQuery = countQuery.eq('turma_id', filtros.turma_id);
      }
      if (filtros?.professor_id) {
        countQuery = countQuery.eq('professor_id', filtros.professor_id);
      }

      // Contagem de enviados (slack_enviado = true e sem erro)
      let enviadosQuery = supabase
        .from('alertas_falta')
        .select('*, alunos!inner(active)', { count: 'exact', head: true })
        .eq('alunos.active', true)
        .eq('slack_enviado', true)
        .is('slack_erro', null);
      
      if (filtros?.data_inicio) {
        enviadosQuery = enviadosQuery.gte('created_at', filtros.data_inicio);
      }
      if (filtros?.data_fim) {
        enviadosQuery = enviadosQuery.lte('created_at', filtros.data_fim);
      }
      if (filtros?.tipo_criterio) {
        enviadosQuery = enviadosQuery.eq('tipo_criterio', filtros.tipo_criterio);
      }
      if (filtros?.unit_id) {
        enviadosQuery = enviadosQuery.eq('unit_id', filtros.unit_id);
      }
      if (filtros?.turma_id) {
        enviadosQuery = enviadosQuery.eq('turma_id', filtros.turma_id);
      }
      if (filtros?.professor_id) {
        enviadosQuery = enviadosQuery.eq('professor_id', filtros.professor_id);
      }

      // Contagem de com erro
      let comErroQuery = supabase
        .from('alertas_falta')
        .select('*, alunos!inner(active)', { count: 'exact', head: true })
        .eq('alunos.active', true)
        .not('slack_erro', 'is', null);
      
      if (filtros?.data_inicio) {
        comErroQuery = comErroQuery.gte('created_at', filtros.data_inicio);
      }
      if (filtros?.data_fim) {
        comErroQuery = comErroQuery.lte('created_at', filtros.data_fim);
      }
      if (filtros?.tipo_criterio) {
        comErroQuery = comErroQuery.eq('tipo_criterio', filtros.tipo_criterio);
      }
      if (filtros?.unit_id) {
        comErroQuery = comErroQuery.eq('unit_id', filtros.unit_id);
      }
      if (filtros?.turma_id) {
        comErroQuery = comErroQuery.eq('turma_id', filtros.turma_id);
      }
      if (filtros?.professor_id) {
        comErroQuery = comErroQuery.eq('professor_id', filtros.professor_id);
      }

      // Contagem de resolvidos
      let resolvidosQuery = supabase
        .from('alertas_falta')
        .select('*, alunos!inner(active)', { count: 'exact', head: true })
        .eq('alunos.active', true)
        .eq('status', 'resolvido');
      
      if (filtros?.data_inicio) {
        resolvidosQuery = resolvidosQuery.gte('created_at', filtros.data_inicio);
      }
      if (filtros?.data_fim) {
        resolvidosQuery = resolvidosQuery.lte('created_at', filtros.data_fim);
      }
      if (filtros?.tipo_criterio) {
        resolvidosQuery = resolvidosQuery.eq('tipo_criterio', filtros.tipo_criterio);
      }
      if (filtros?.unit_id) {
        resolvidosQuery = resolvidosQuery.eq('unit_id', filtros.unit_id);
      }
      if (filtros?.turma_id) {
        resolvidosQuery = resolvidosQuery.eq('turma_id', filtros.turma_id);
      }
      if (filtros?.professor_id) {
        resolvidosQuery = resolvidosQuery.eq('professor_id', filtros.professor_id);
      }

      const [enviadosResult, comErroResult, resolvidosResult] = await Promise.all([
        enviadosQuery,
        comErroQuery,
        resolvidosQuery
      ]);

      return {
        alertas: alertasFiltrados,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
        totalEnviados: enviadosResult.count || 0,
        totalComErro: comErroResult.count || 0,
        totalResolvidos: resolvidosResult.count || 0
      };
    }
  });
}