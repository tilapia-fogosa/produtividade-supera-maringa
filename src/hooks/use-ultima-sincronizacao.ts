import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUltimaSincronizacao = () => {
  return useQuery({
    queryKey: ["ultimas-sincronizacoes"],
    queryFn: async () => {
      console.log('🔄 Buscando últimas sincronizações de turmas');
      
      const { data, error } = await supabase
        .from('data_imports')
        .select('*')
        .eq('import_type', 'turmas-xls')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('❌ Erro ao buscar sincronizações:', error);
        throw error;
      }
      
      console.log('✅ Sincronizações encontradas:', data);
      
      return data || [];
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });
};