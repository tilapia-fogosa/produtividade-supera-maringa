import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface IpValidationResult {
  allowed: boolean;
  ip: string;
  message: string;
}

export function useValidateIp() {
  return useQuery({
    queryKey: ['validate-ip'],
    queryFn: async (): Promise<IpValidationResult> => {
      const { data, error } = await supabase.functions.invoke('validate-ip');

      if (error) {
        console.error('Erro ao validar IP:', error);
        throw error;
      }

      return data as IpValidationResult;
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    retry: 1,
  });
}
