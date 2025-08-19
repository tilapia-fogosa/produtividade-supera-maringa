import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TurmaModalData = {
  turma: {
    id: string;
    nome: string;
    sala: string;
    dia_semana: string;
    unit_id?: string;
  };
  professor: {
    id: string;
    nome: string;
    slack_username: string;
  };
  alunos: Array<{
    id: string;
    nome: string;
    idade: number;
    dias_supera: number;
    foto_url: string | null;
    telefone?: string;
    email?: string;
    is_funcionario?: boolean;
  }>;
  funcionarios: Array<{
    id: string;
    nome: string;
    idade: number;
    dias_supera: number;
    foto_url: string | null;
    telefone?: string;
    email?: string;
    cargo?: string;
    is_funcionario: boolean;
  }>;
  reposicoes: Array<{
    id: string;
    nome: string;
    idade: number;
    dias_supera: number;
    foto_url: string | null;
    telefone?: string;
    email?: string;
    data_reposicao: string;
    observacoes?: string;
  }>;
  aulas_experimentais: Array<{
    id: string;
    cliente_nome: string;
    data_aula_experimental: string;
    responsavel_id: string;
    responsavel_tipo: 'professor' | 'funcionario';
    descricao_cliente?: string;
    responsavel_nome?: string;
  }>;
  estatisticas: {
    total_alunos_ativos: number;
    total_funcionarios_ativos: number;
    total_reposicoes_dia: number;
    total_aulas_experimentais_dia: number;
    media_idade: number;
    media_dias_supera: number;
  };
};

export const useTurmaModal = (turmaId: string | null, dataConsulta?: Date) => {
  return useQuery({
    queryKey: ["turma-modal", turmaId, dataConsulta?.toISOString().split('T')[0]],
    queryFn: async () => {
      if (!turmaId) return null;
      
      const dataConsultaStr = dataConsulta ? dataConsulta.toISOString().split('T')[0] : null;
      
      console.log('🎯 useTurmaModal - Parâmetros:', {
        turmaId,
        dataConsulta: dataConsultaStr
      });
      
      // Sempre passa ambos os parâmetros para evitar ambiguidade
      const params = { 
        p_turma_id: turmaId,
        p_data_consulta: dataConsultaStr
      };
      
      const { data, error } = await supabase.rpc("get_turma_modal_data", params);
      
      if (error) {
        console.error("❌ Erro ao buscar dados da turma:", error);
        throw error;
      }
      
      const typedData = data as TurmaModalData;
      console.log('✅ Dados retornados get_turma_modal_data:', {
        turma: typedData?.turma?.nome,
        alunos: typedData?.alunos?.length || 0,
        funcionarios: typedData?.funcionarios?.length || 0,
        reposicoes: typedData?.reposicoes?.length || 0,
        aulas_experimentais: typedData?.aulas_experimentais?.length || 0,
        estatisticas: typedData?.estatisticas
      });
      
      return data as TurmaModalData;
    },
    enabled: !!turmaId,
  });
};