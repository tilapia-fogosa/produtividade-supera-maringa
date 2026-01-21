import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentFuncionario } from '@/hooks/use-current-funcionario';

export type TipoAtividadeEvasao = 
  | 'acolhimento'
  | 'atendimento_financeiro'
  | 'evasao'
  | 'atendimento_pedagogico'
  | 'retencao';

export type StatusAtividade = 'pendente' | 'concluida';

export interface AtividadeAlertaEvasao {
  id: string;
  alerta_evasao_id: string;
  tipo_atividade: TipoAtividadeEvasao;
  descricao: string;
  responsavel_id: string | null;
  responsavel_nome: string | null;
  created_at: string;
  status: StatusAtividade;
}

// Tipos permitidos ao gerar nova atividade a partir de acolhimento
export const TIPOS_PERMITIDOS_APOS_ACOLHIMENTO: TipoAtividadeEvasao[] = [
  'atendimento_financeiro',
  'atendimento_pedagogico',
  'acolhimento',
  'retencao'
];

export const TIPOS_ATIVIDADE: { value: TipoAtividadeEvasao; label: string; color: string }[] = [
  { value: 'acolhimento', label: 'Acolhimento', color: 'bg-blue-500' },
  { value: 'atendimento_financeiro', label: 'Negociação Financeira', color: 'bg-purple-500' },
  { value: 'evasao', label: 'Evasão', color: 'bg-red-500' },
  { value: 'atendimento_pedagogico', label: 'Atendimento Pedagógico', color: 'bg-orange-500' },
  { value: 'retencao', label: 'Retenção', color: 'bg-green-500' },
];

export function useAtividadesAlertaEvasao(alertaEvasaoId: string | null) {
  const queryClient = useQueryClient();
  const { funcionarioNome } = useCurrentFuncionario();

  const { data: atividades = [], isLoading, error } = useQuery({
    queryKey: ['atividades-alerta-evasao', alertaEvasaoId],
    queryFn: async () => {
      if (!alertaEvasaoId) return [];
      
      const { data, error } = await supabase
        .from('atividades_alerta_evasao')
        .select('*')
        .eq('alerta_evasao_id', alertaEvasaoId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AtividadeAlertaEvasao[];
    },
    enabled: !!alertaEvasaoId,
  });

  const criarAtividadeMutation = useMutation({
    mutationFn: async ({ 
      tipo_atividade, 
      descricao,
      atividadeAnteriorId
    }: { 
      tipo_atividade: TipoAtividadeEvasao; 
      descricao: string;
      atividadeAnteriorId?: string;
    }) => {
      if (!alertaEvasaoId) throw new Error('Alerta ID não fornecido');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Se tem atividade anterior, marca ela como concluída
      if (atividadeAnteriorId) {
        const { error: updateError } = await supabase
          .from('atividades_alerta_evasao')
          .update({ status: 'concluida' })
          .eq('id', atividadeAnteriorId);
        
        if (updateError) throw updateError;
      }
      
      // Cria a nova atividade
      const { data, error } = await supabase
        .from('atividades_alerta_evasao')
        .insert({
          alerta_evasao_id: alertaEvasaoId,
          tipo_atividade,
          descricao,
          responsavel_id: user?.id || null,
          responsavel_nome: funcionarioNome || user?.email || 'Usuário',
          status: 'pendente'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades-alerta-evasao', alertaEvasaoId] });
    },
  });

  return {
    atividades,
    isLoading,
    error,
    criarAtividade: criarAtividadeMutation.mutateAsync,
    isCriando: criarAtividadeMutation.isPending,
  };
}
