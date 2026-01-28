import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export interface FichaRescisao {
  id: string;
  alerta_evasao_id: string;
  aluno_id: string;
  aluno_nome: string;
  turma_nome: string | null;
  professor_nome: string | null;
  data_criacao: string;
  status: 'pendente' | 'concluida';
  concluido_por_nome: string | null;
  valor_mensalidade: number | null;
}

export interface FichasRescisaoFilters {
  nome?: string;
  dataInicio?: Date;
  dataFim?: Date;
}

export function useFichasRescisao(filters: FichasRescisaoFilters = {}) {
  const { activeUnit } = useActiveUnit();

  return useQuery({
    queryKey: ["fichas-rescisao", activeUnit?.id, filters.nome, filters.dataInicio?.toISOString(), filters.dataFim?.toISOString()],
    queryFn: async (): Promise<{ pendentes: FichaRescisao[]; concluidas: FichaRescisao[] }> => {
      // Buscar atividades do tipo 'criar_ficha_rescisao'
      const { data: atividades, error } = await supabase
        .from("atividades_alerta_evasao")
        .select(`
          id,
          alerta_evasao_id,
          status,
          created_at,
          concluido_por_nome,
          alerta_evasao!inner (
            id,
            alunos!inner (
              id,
              nome,
              unit_id,
              turma_id,
              valor_mensalidade,
              turmas (
                id,
                nome,
                professor_id,
                professores (
                  id,
                  nome
                )
              )
            )
          )
        `)
        .eq("tipo_atividade", "criar_ficha_rescisao")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!atividades?.length) return { pendentes: [], concluidas: [] };

      // Mapear e filtrar dados
      let fichas: FichaRescisao[] = atividades.map((atividade: any) => {
        const alerta = atividade.alerta_evasao;
        const aluno = alerta?.alunos;
        const turma = aluno?.turmas;
        const professor = turma?.professores;

        return {
          id: atividade.id,
          alerta_evasao_id: atividade.alerta_evasao_id,
          aluno_id: aluno?.id || "",
          aluno_nome: aluno?.nome || "Aluno não encontrado",
          turma_nome: turma?.nome || null,
          professor_nome: professor?.nome || null,
          data_criacao: atividade.created_at,
          status: atividade.status as 'pendente' | 'concluida',
          concluido_por_nome: atividade.concluido_por_nome,
          valor_mensalidade: aluno?.valor_mensalidade || null,
          unit_id: aluno?.unit_id
        };
      });

      // Filtrar por unidade
      if (activeUnit?.id) {
        fichas = fichas.filter((f: any) => f.unit_id === activeUnit.id);
      }

      // Filtrar por nome
      if (filters.nome) {
        const nomeLower = filters.nome.toLowerCase();
        fichas = fichas.filter(f => f.aluno_nome.toLowerCase().includes(nomeLower));
      }

      // Filtrar por data início
      if (filters.dataInicio) {
        fichas = fichas.filter(f => new Date(f.data_criacao) >= filters.dataInicio!);
      }

      // Filtrar por data fim
      if (filters.dataFim) {
        const dataFimAjustada = new Date(filters.dataFim);
        dataFimAjustada.setHours(23, 59, 59, 999);
        fichas = fichas.filter(f => new Date(f.data_criacao) <= dataFimAjustada);
      }

      // Separar por status
      const pendentes = fichas.filter(f => f.status === 'pendente');
      const concluidas = fichas.filter(f => f.status === 'concluida');

      return { pendentes, concluidas };
    },
    enabled: true,
  });
}
