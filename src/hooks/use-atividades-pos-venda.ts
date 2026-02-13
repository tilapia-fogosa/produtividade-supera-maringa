import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export interface AtividadePosVenda {
  id: string;
  client_id: string;
  client_name: string;
  created_at: string;
  // Status de cada seção
  cadastrais_completo: boolean;
  comerciais_completo: boolean;
  pedagogicos_completo: boolean;
  finais_completo: boolean;
  // Status manual que sobrescreve o cálculo dinâmico
  status_manual: string | null;
}

export interface AtividadesPosVendaFilters {
  dataInicio?: Date;
  dataFim?: Date;
  statusConclusao?: 'todos' | 'concluido' | 'pendente';
}

export function useAtividadesPosVenda(filters?: AtividadesPosVendaFilters) {
  const { activeUnit } = useActiveUnit();

  return useQuery({
    queryKey: ["atividades-pos-venda", activeUnit?.id, filters],
    queryFn: async (): Promise<AtividadePosVenda[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase
        .from("atividade_pos_venda")
        .select(`
          id,
          client_id,
          client_name,
          created_at,
          full_name,
          cpf,
          birth_date,
          address_street,
          kit_type,
          enrollment_amount,
          monthly_fee_amount,
          turma_id,
          data_aula_inaugural,
          check_lancar_sgs,
          check_assinar_contrato,
          check_entregar_kit,
          check_cadastrar_pagamento,
          check_sincronizar_sgs,
          check_grupo_whatsapp,
          status_manual
        `) as any)
        .eq("active", true)
        .eq("unit_id", activeUnit!.id)
        .order("created_at", { ascending: false });

      // Filtro de data início
      if (filters?.dataInicio) {
        const startDate = new Date(filters.dataInicio);
        startDate.setHours(0, 0, 0, 0);
        query = query.gte("created_at", startDate.toISOString());
      }

      // Filtro de data fim
      if (filters?.dataFim) {
        const endDate = new Date(filters.dataFim);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data?.length) return [];

      // Buscar client_ids para verificar alunos vinculados
      const clientIds = [...new Set(data.map((a) => a.client_id).filter(Boolean))] as string[];

      // Buscar alunos vinculados
      const { data: alunosVinculados } = await supabase
        .from("alunos")
        .select("id, client_id")
        .in("client_id", clientIds);

      // Mapear alunos por client_id
      const alunosMap = new Map<string, boolean>();
      alunosVinculados?.forEach((aluno) => {
        if (aluno.client_id) {
          alunosMap.set(aluno.client_id, true);
        }
      });

      // Montar resultado
      let result: AtividadePosVenda[] = data.map((pv) => {
        // Se tem status_manual = 'Concluido', considera todas as seções como completas
        const isManualCompleto = pv.status_manual === 'Concluido';

        // Verificar completude de cada seção (ou sobrescrever se status_manual)
        const cadastrais_completo = isManualCompleto || !!(
          pv.full_name &&
          pv.cpf &&
          pv.birth_date &&
          pv.address_street
        );

        const comerciais_completo = isManualCompleto || !!(
          pv.kit_type &&
          pv.enrollment_amount !== null &&
          pv.monthly_fee_amount !== null
        );

        const pedagogicos_completo = isManualCompleto || !!(
          pv.turma_id &&
          pv.data_aula_inaugural
        );

        // Verificar se tem aluno vinculado
        const temAlunoVinculado = alunosMap.has(pv.client_id);

        const finais_completo = isManualCompleto || !!(
          pv.check_lancar_sgs &&
          pv.check_assinar_contrato &&
          pv.check_entregar_kit &&
          pv.check_cadastrar_pagamento &&
          pv.check_sincronizar_sgs &&
          pv.check_grupo_whatsapp &&
          temAlunoVinculado
        );

        return {
          id: pv.id,
          client_id: pv.client_id,
          client_name: pv.full_name || pv.client_name || "Sem nome",
          created_at: pv.created_at,
          cadastrais_completo,
          comerciais_completo,
          pedagogicos_completo,
          finais_completo,
          status_manual: pv.status_manual,
        };
      });

      // Aplicar filtro de status de conclusão
      if (filters?.statusConclusao === 'concluido') {
        result = result.filter(c => 
          c.cadastrais_completo && 
          c.comerciais_completo && 
          c.pedagogicos_completo && 
          c.finais_completo
        );
      } else if (filters?.statusConclusao === 'pendente') {
        result = result.filter(c => 
          !c.cadastrais_completo || 
          !c.comerciais_completo || 
          !c.pedagogicos_completo || 
          !c.finais_completo
        );
      }

      return result;
    },
    enabled: !!activeUnit?.id,
  });
}
