import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUltimaSincronizacao = () => {
  return useQuery({
    queryKey: ["ultima-sincronizacao"],
    queryFn: async () => {
      console.log('🔄 Buscando última sincronização de turmas');
      
      const { data, error } = await supabase
        .from('data_imports')
        .select('*')
        .eq('import_type', 'turmas-xls')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar última sincronização:', error);
        throw error;
      }
      
      console.log('✅ Última sincronização encontrada:', data);
      
      return data || null;
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });
};