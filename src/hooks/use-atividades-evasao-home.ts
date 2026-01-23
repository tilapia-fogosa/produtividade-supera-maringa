import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentProfessor } from './use-current-professor';
import { useUserPermissions } from './useUserPermissions';

export interface AtividadeEvasaoHome {
  id: string;
  alerta_evasao_id: string;
  tipo_atividade: string;
  descricao: string;
  status: string;
  data_agendada: string | null;
  created_at: string;
  aluno_nome: string;
  aluno_id: string;
  turma_nome: string | null;
  professor_responsavel_id: string | null;
  departamento_responsavel: string | null;
}

export function useAtividadesEvasaoHome() {
  const { professorId, isProfessor } = useCurrentProfessor();
  const { isAdmin, isManagement, isFinanceiro } = useUserPermissions();
  
  const isAdministrativo = isAdmin || isManagement || isFinanceiro;

  return useQuery({
    queryKey: ['atividades-evasao-home', professorId, isAdministrativo],
    queryFn: async () => {
      // Buscar atividades pendentes
      let query = supabase
        .from('atividades_alerta_evasao')
        .select(`
          id,
          alerta_evasao_id,
          tipo_atividade,
          descricao,
          status,
          data_agendada,
          created_at,
          professor_responsavel_id,
          departamento_responsavel,
          alerta_evasao:alerta_evasao!inner(
            aluno_id,
            status,
            aluno:alunos!inner(
              nome,
              active,
              turma:turmas(nome)
            )
          )
        `)
        .eq('status', 'pendente')
        .eq('alerta_evasao.aluno.active', true);
      
      // Filtrar baseado no perfil do usuário
      if (isProfessor && professorId) {
        // Professor vê suas atividades atribuídas
        query = query.eq('professor_responsavel_id', professorId);
      } else if (isAdministrativo) {
        // Administrativo vê atividades do departamento + todas se for admin
        // Não adiciona filtro extra para admins - mostra tudo
      } else {
        // Outros usuários não veem nada
        return [];
      }

      const { data, error } = await query.order('data_agendada', { ascending: true, nullsFirst: false });

      if (error) {
        console.error('Erro ao buscar atividades de evasão:', error);
        throw error;
      }

      // Transformar dados para o formato esperado
      const atividades: AtividadeEvasaoHome[] = (data || []).map((item: any) => ({
        id: item.id,
        alerta_evasao_id: item.alerta_evasao_id,
        tipo_atividade: item.tipo_atividade,
        descricao: item.descricao,
        status: item.status,
        data_agendada: item.data_agendada,
        created_at: item.created_at,
        aluno_nome: item.alerta_evasao?.aluno?.nome || 'Nome não encontrado',
        aluno_id: item.alerta_evasao?.aluno_id,
        turma_nome: item.alerta_evasao?.aluno?.turma?.nome || null,
        professor_responsavel_id: item.professor_responsavel_id,
        departamento_responsavel: item.departamento_responsavel,
      }));

      return atividades;
    },
    enabled: isProfessor || isAdministrativo,
  });
}
