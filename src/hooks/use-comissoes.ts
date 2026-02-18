import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export interface ComissaoItem {
  id: string;
  aluno_nome: string;
  vendedor_nome: string;
  valor_mensalidade: number | null;
  valor_material: number | null;
  valor_matricula: number | null;
  status: string | null;
}

export function useComissoes(mes: number, ano: number) {
  const { activeUnit } = useActiveUnit();

  return useQuery({
    queryKey: ["comissoes", activeUnit?.id, mes, ano],
    queryFn: async (): Promise<ComissaoItem[]> => {
      // Calcular primeiro e último dia do mês
      const startDate = new Date(ano, mes, 1);
      const endDate = new Date(ano, mes + 1, 0, 23, 59, 59, 999);

      const { data, error } = await (supabase
        .from("atividade_pos_venda")
        .select(`
          id,
          full_name,
          client_name,
          client_id,
          monthly_fee_amount,
          material_amount,
          enrollment_amount,
          status_manual,
          created_by,
          cpf,
          birth_date,
          address_street,
          kit_type,
          turma_id,
          data_aula_inaugural,
          check_lancar_sgs,
          check_assinar_contrato,
          check_entregar_kit,
          check_cadastrar_pagamento,
          check_sincronizar_sgs,
          check_grupo_whatsapp
        `) as any)
        .eq("active", true)
        .eq("unit_id", activeUnit!.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data?.length) return [];

      // Buscar alunos vinculados para verificar finais_completo
      const clientIds = [...new Set(data.map((d: any) => d.client_id).filter(Boolean))] as string[];
      const alunosMap = new Map<string, boolean>();
      if (clientIds.length > 0) {
        const { data: alunos } = await supabase
          .from("alunos")
          .select("client_id")
          .in("client_id", clientIds);
        alunos?.forEach((a: any) => {
          if (a.client_id) alunosMap.set(a.client_id, true);
        });
      }

      // Buscar nomes dos vendedores
      const createdByIds = [...new Set(data.map((d: any) => d.created_by).filter(Boolean))] as string[];
      
      let vendedoresMap = new Map<string, string>();
      if (createdByIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", createdByIds);

        profiles?.forEach((p) => {
          vendedoresMap.set(p.id, p.full_name || "Sem nome");
        });
      }

      return data.map((item: any) => {
        const isManualCompleto = item.status_manual === 'Concluido';

        const cadastrais = isManualCompleto || !!(item.full_name && item.cpf && item.birth_date && item.address_street);
        const comerciais = isManualCompleto || !!(item.kit_type && item.enrollment_amount !== null && item.monthly_fee_amount !== null);
        const pedagogicos = isManualCompleto || !!(item.turma_id && item.data_aula_inaugural);
        const temAluno = alunosMap.has(item.client_id);
        const finais = isManualCompleto || !!(
          item.check_lancar_sgs && item.check_assinar_contrato && item.check_entregar_kit &&
          item.check_cadastrar_pagamento && item.check_sincronizar_sgs && item.check_grupo_whatsapp && temAluno
        );

        const isConcluido = cadastrais && comerciais && pedagogicos && finais;

        return {
          id: item.id,
          aluno_nome: item.full_name || item.client_name || "Sem nome",
          vendedor_nome: vendedoresMap.get(item.created_by) || "—",
          valor_mensalidade: item.monthly_fee_amount,
          valor_material: item.material_amount,
          valor_matricula: item.enrollment_amount,
          status: isConcluido ? "Concluído" : "Pendente",
        };
      });
    },
    enabled: !!activeUnit?.id,
  });
}
