
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AlertaLancamento {
  id: string;
  turma_id: string;
  professor_id: string;
  data_aula: string;
  created_at: string;
  status: string;
  arquivado_por: string | null;
  arquivado_em: string | null;
  turma: {
    nome: string;
    professor: {
      nome: string;
    };
  };
}

export function useAlertasLancamento() {
  const queryClient = useQueryClient();

  const { data: alertas = [], isLoading } = useQuery({
    queryKey: ['alertas-lancamento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alertas_lancamento')
        .select(`
          *,
          turma:turmas (
            nome,
            professor:professores (
              nome
            )
          )
        `)
        .eq('status', 'pendente')
        .order('data_aula', { ascending: false });

      if (error) throw error;
      return (data || []) as AlertaLancamento[];
    }
  });

  const arquivarAlerta = useMutation({
    mutationFn: async (alertaId: string) => {
      const { error } = await supabase
        .from('alertas_lancamento')
        .update({ 
          status: 'arquivado',
          arquivado_por: (await supabase.auth.getUser()).data.user?.id,
          arquivado_em: new Date().toISOString()
        })
        .eq('id', alertaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas-lancamento'] });
      toast.success('Alerta arquivado com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao arquivar alerta:', error);
      toast.error('Erro ao arquivar alerta');
    }
  });

  return {
    alertas,
    isLoading,
    arquivarAlerta
  };
}
