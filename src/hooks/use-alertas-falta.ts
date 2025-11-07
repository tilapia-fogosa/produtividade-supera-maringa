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
          aluno:alunos!alertas_falta_aluno_id_fkey(nome, foto_url),
          turma:turmas!alertas_falta_turma_id_fkey(nome),
          professor:professores!alertas_falta_professor_id_fkey(nome, slack_username),
          unit:units!alertas_falta_unit_id_fkey(name)
        `, { count: 'exact' })
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
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Erro ao buscar alertas de falta:', error);
        throw error;
      }
      
      return {
        alertas: data as AlertaFalta[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    }
  });
}