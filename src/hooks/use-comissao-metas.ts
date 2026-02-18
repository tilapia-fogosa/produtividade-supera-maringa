import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export interface ComissaoMeta {
  id: string;
  unit_id: string;
  mes: number;
  ano: number;
  valor_meta: number;
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export { MESES };

export function useComissaoMetas() {
  const { activeUnit } = useActiveUnit();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["comissao-metas", activeUnit?.id],
    queryFn: async (): Promise<ComissaoMeta[]> => {
      const { data, error } = await (supabase
        .from("comissao_metas")
        .select("*")
        .eq("unit_id", activeUnit!.id)
        .order("ano", { ascending: false })
        .order("mes", { ascending: true }) as any);

      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        valor_meta: Number(d.valor_meta),
      }));
    },
    enabled: !!activeUnit?.id,
  });

  const addMeta = useMutation({
    mutationFn: async (meta: { mes: number; ano: number; valor_meta: number }) => {
      const { error } = await (supabase
        .from("comissao_metas")
        .upsert({
          unit_id: activeUnit!.id,
          mes: meta.mes,
          ano: meta.ano,
          valor_meta: meta.valor_meta,
          updated_at: new Date().toISOString(),
        }, { onConflict: "unit_id,mes,ano" }) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comissao-metas", activeUnit?.id] });
    },
  });

  const deleteMeta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from("comissao_metas")
        .delete()
        .eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comissao-metas", activeUnit?.id] });
    },
  });

  return { metas: query.data || [], isLoading: query.isLoading, addMeta, deleteMeta };
}
