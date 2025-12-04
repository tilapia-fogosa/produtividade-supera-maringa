import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type TipoRegistro = 'entrada' | 'saida';

export interface RegistroPonto {
  id: string;
  id_usuario: string;
  created_at: string;
  tipo_registro: TipoRegistro;
}

export function useRegistroPonto() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: registros, isLoading } = useQuery({
    queryKey: ['registro-ponto', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('registro_ponto')
        .select('*')
        .eq('id_usuario', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RegistroPonto[];
    },
    enabled: !!user?.id,
  });

  const registrarPonto = useMutation({
    mutationFn: async (tipo: TipoRegistro) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('registro_ponto')
        .insert({
          id_usuario: user.id,
          tipo_registro: tipo,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registro-ponto', user?.id] });
    },
  });

  // Pegar último registro do dia atual
  const registrosHoje = registros?.filter(r => {
    const hoje = new Date().toISOString().split('T')[0];
    const dataRegistro = new Date(r.created_at).toISOString().split('T')[0];
    return hoje === dataRegistro;
  }) || [];

  const ultimoRegistroHoje = registrosHoje[0];

  return {
    registros,
    registrosHoje,
    ultimoRegistroHoje,
    isLoading,
    registrarPonto,
  };
}
