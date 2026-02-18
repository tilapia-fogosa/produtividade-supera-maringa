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
          monthly_fee_amount,
          material_amount,
          enrollment_amount,
          status_manual,
          created_by
        `) as any)
        .eq("active", true)
        .eq("unit_id", activeUnit!.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data?.length) return [];

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

      return data.map((item: any) => ({
        id: item.id,
        aluno_nome: item.full_name || item.client_name || "Sem nome",
        vendedor_nome: vendedoresMap.get(item.created_by) || "—",
        valor_mensalidade: item.monthly_fee_amount,
        valor_material: item.material_amount,
        valor_matricula: item.enrollment_amount,
        status: item.status_manual,
      }));
    },
    enabled: !!activeUnit?.id,
  });
}
