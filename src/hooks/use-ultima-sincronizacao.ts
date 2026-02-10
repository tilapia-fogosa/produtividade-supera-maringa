import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export const useUltimaSincronizacao = () => {
  const { activeUnit } = useActiveUnit();

  return useQuery({
    queryKey: ["ultimas-sincronizacoes", activeUnit?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_imports')
        .select('*')
        .eq('import_type', 'turmas-xls')
        .eq('status', 'completed')
        .eq('unit_id', activeUnit!.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeUnit?.id,
    refetchInterval: 30000,
  });
};