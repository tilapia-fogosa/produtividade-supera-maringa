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
  departamento_responsavel: string | null;
  professor_responsavel_id: string | null;
  concluido_por_id: string | null;
  concluido_por_nome: string | null;
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

// Busca professor da turma do aluno associado ao alerta
async function buscarProfessorDaTurma(alertaId: string): Promise<{ id: string; nome: string } | null> {
  const { data, error } = await supabase
    .from('alerta_evasao')
    .select(`
      alunos!inner(
        turma_id,
        turmas!inner(
          professor_id,
          professores!inner(id, nome)
        )
      )
    `)
    .eq('id', alertaId)
    .single();
  
  if (error || !data) return null;
  
  // Navegar pela estrutura aninhada
  const alunos = data.alunos as any;
  const turmas = alunos?.turmas;
  const professores = turmas?.professores;
  
  if (professores?.id && professores?.nome) {
    return { id: professores.id, nome: professores.nome };
  }
  
  return null;
}

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
      
      // Se tem atividade anterior, marca ela como concluída e registra quem concluiu
      if (atividadeAnteriorId) {
        const { error: updateError } = await supabase
          .from('atividades_alerta_evasao')
          .update({ 
            status: 'concluida',
            concluido_por_id: user?.id || null,
            concluido_por_nome: funcionarioNome || user?.email || 'Usuário'
          })
          .eq('id', atividadeAnteriorId);
        
        if (updateError) throw updateError;
      }
      
      // Determinar responsável baseado no tipo
      let departamento_responsavel: string | null = null;
      let professor_responsavel_id: string | null = null;
      let responsavel_nome: string | null = funcionarioNome || user?.email || 'Usuário';
      
      // Tipos terminais: retenção e evasão
      const isTerminal = ['retencao', 'evasao'].includes(tipo_atividade);
      
      if (tipo_atividade === 'atendimento_financeiro') {
        // Negociação Financeira → Departamento Administrativo
        departamento_responsavel = 'administrativo';
        responsavel_nome = 'Administrativo';
      } else if (['acolhimento', 'atendimento_pedagogico'].includes(tipo_atividade)) {
        // Acolhimento / Atendimento Pedagógico → Professor da turma
        const professor = await buscarProfessorDaTurma(alertaEvasaoId);
        if (professor) {
          professor_responsavel_id = professor.id;
          responsavel_nome = professor.nome;
        }
      }
      
      // Cria a nova atividade
      const { data, error } = await supabase
        .from('atividades_alerta_evasao')
        .insert({
          alerta_evasao_id: alertaEvasaoId,
          tipo_atividade,
          descricao,
          responsavel_id: user?.id || null,
          responsavel_nome,
          status: isTerminal ? 'concluida' : 'pendente',
          departamento_responsavel,
          professor_responsavel_id,
          // Se for terminal, já marca quem concluiu
          concluido_por_id: isTerminal ? (user?.id || null) : null,
          concluido_por_nome: isTerminal ? (funcionarioNome || user?.email || 'Usuário') : null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Se for tipo terminal, atualiza o status do alerta
      if (isTerminal) {
        const { error: alertaError } = await supabase
          .from('alerta_evasao')
          .update({ 
            status: 'resolvido',
            updated_at: new Date().toISOString()
          })
          .eq('id', alertaEvasaoId);
        
        if (alertaError) throw alertaError;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades-alerta-evasao', alertaEvasaoId] });
      queryClient.invalidateQueries({ queryKey: ['alertas-evasao-lista'] });
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
