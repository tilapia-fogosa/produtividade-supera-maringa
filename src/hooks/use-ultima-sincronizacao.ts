import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export const useUltimaSincronizacao = () => {
  const { activeUnit } = useActiveUnit();

  return useQuery({
    queryKey: ["ultimas-sincronizacoes", activeUnit?.id],
    queryFn: async () => {
      console.log('🔄 Buscando últimas sincronizações de turmas');
      
      let query = supabase
        .from('data_imports')
        .select('*')
        .eq('import_type', 'turmas-xls')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (activeUnit?.id) {
        query = query.eq('unit_id', activeUnit.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Erro ao buscar sincronizações:', error);
        throw error;
      }
      
      console.log('✅ Sincronizações encontradas:', data);
      
      return data || [];
    },
    refetchInterval: 30000,
  });
};