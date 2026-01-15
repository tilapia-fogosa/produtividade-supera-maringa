import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type TipoRegistro = 'entrada' | 'saida';
type UserRole = Database['public']['Enums']['user_role'];

export interface RegistroPontoAdmin {
  id: string;
  id_usuario: string;
  created_at: string;
  tipo_registro: TipoRegistro;
  usuario_nome?: string;
  usuario_email?: string;
  role?: string;
}

interface FetchRegistrosParams {
  userId?: string;
  tipoRegistro?: TipoRegistro;
  role?: string;
  dataInicio?: string;
  dataFim?: string;
  unitId?: string;
}

export function useRegistrosPontoAdmin(params?: FetchRegistrosParams) {
  const queryClient = useQueryClient();

  const { data: registros, isLoading, error } = useQuery({
    queryKey: ['registros-ponto-admin', params],
    queryFn: async () => {
      // Primeiro buscar os registros de ponto
      let query = supabase
        .from('registro_ponto')
        .select('id, id_usuario, created_at, tipo_registro')
        .order('created_at', { ascending: false });

      if (params?.userId) {
        query = query.eq('id_usuario', params.userId);
      }
      if (params?.tipoRegistro) {
        query = query.eq('tipo_registro', params.tipoRegistro);
      }
      if (params?.dataInicio) {
        query = query.gte('created_at', `${params.dataInicio}T00:00:00`);
      }
      if (params?.dataFim) {
        query = query.lte('created_at', `${params.dataFim}T23:59:59`);
      }

      const { data: registrosData, error: registrosError } = await query;
      if (registrosError) throw registrosError;
      if (!registrosData || registrosData.length === 0) return [];

      // Buscar IDs únicos de usuários
      const userIds = [...new Set(registrosData.map(r => r.id_usuario))];

      // Buscar profiles dos usuários
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

      // Se tiver filtro por role, buscar roles
      let roleMap = new Map<string, string>();
      let filteredUserIds = new Set(userIds);

      if (params?.unitId) {
        const { data: unitUsersData } = await supabase
          .from('unit_users')
          .select('user_id, role')
          .eq('unit_id', params.unitId)
          .in('user_id', userIds)
          .eq('active', true);

        if (unitUsersData) {
          roleMap = new Map(unitUsersData.map(u => [u.user_id, u.role]));
          
          if (params?.role) {
            const usersComRole = unitUsersData.filter(u => u.role === params.role);
            filteredUserIds = new Set(usersComRole.map(u => u.user_id));
          }
        }
      }

      // Montar resultado
      let result: RegistroPontoAdmin[] = registrosData.map(r => ({
        id: r.id,
        id_usuario: r.id_usuario,
        created_at: r.created_at,
        tipo_registro: r.tipo_registro as TipoRegistro,
        usuario_nome: profilesMap.get(r.id_usuario)?.full_name || undefined,
        usuario_email: profilesMap.get(r.id_usuario)?.email || undefined,
        role: roleMap.get(r.id_usuario) || undefined,
      }));

      // Filtrar por role se necessário
      if (params?.role) {
        result = result.filter(r => filteredUserIds.has(r.id_usuario));
      }

      return result;
    },
  });

  // Buscar usuários com registros para o filtro
  const { data: usuariosComRegistros } = useQuery({
    queryKey: ['usuarios-com-registros', params?.unitId],
    queryFn: async () => {
      const { data: registros } = await supabase
        .from('registro_ponto')
        .select('id_usuario');

      if (!registros) return [];

      const userIds = [...new Set(registros.map(r => r.id_usuario))];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      // Buscar roles dos usuários
      let usersWithRoles = profiles?.map(p => ({ ...p, role: null as string | null }));

      if (params?.unitId && profiles) {
        const { data: unitUsers } = await supabase
          .from('unit_users')
          .select('user_id, role')
          .eq('unit_id', params.unitId)
          .in('user_id', profiles.map(p => p.id))
          .eq('active', true);

        const roleMap = new Map(unitUsers?.map(u => [u.user_id, u.role]));
        usersWithRoles = profiles?.map(p => ({
          ...p,
          role: roleMap.get(p.id) || null
        }));
      }

      return usersWithRoles || [];
    },
  });

  // Buscar roles disponíveis
  const { data: rolesDisponiveis } = useQuery({
    queryKey: ['roles-disponiveis', params?.unitId],
    queryFn: async () => {
      if (!params?.unitId) return [];

      const { data } = await supabase
        .from('unit_users')
        .select('role')
        .eq('unit_id', params.unitId)
        .eq('active', true);

      const uniqueRoles = [...new Set(data?.map(u => u.role))];
      return uniqueRoles as UserRole[];
    },
    enabled: !!params?.unitId,
  });

  // Mutation para atualizar registro
  const atualizarRegistro = useMutation({
    mutationFn: async ({ id, tipo_registro, created_at }: { id: string; tipo_registro?: TipoRegistro; created_at?: string }) => {
      const updateData: { tipo_registro?: TipoRegistro; created_at?: string } = {};
      if (tipo_registro) updateData.tipo_registro = tipo_registro;
      if (created_at) updateData.created_at = created_at;

      const { error } = await supabase
        .from('registro_ponto')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registros-ponto-admin'] });
    },
  });

  // Mutation para excluir registro
  const excluirRegistro = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('registro_ponto')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registros-ponto-admin'] });
    },
  });

  return {
    registros,
    usuariosComRegistros,
    rolesDisponiveis,
    isLoading,
    error,
    atualizarRegistro,
    excluirRegistro,
  };
}

// Hook para estatísticas de horas
export function useEstatisticasHoras(userId: string | undefined, unitId: string | undefined) {
  return useQuery({
    queryKey: ['estatisticas-horas', userId, unitId],
    queryFn: async () => {
      if (!userId) return null;

      const hoje = new Date();
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - hoje.getDay());
      
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

      // Buscar registros do mês
      const { data: registrosMes } = await supabase
        .from('registro_ponto')
        .select('*')
        .eq('id_usuario', userId)
        .gte('created_at', inicioMes.toISOString())
        .order('created_at', { ascending: true });

      if (!registrosMes) return { horasHoje: 0, horasSemana: 0, horasMes: 0, horasPorDia: [] };

      // Calcular horas por dia
      const horasPorDia: { data: string; horas: number }[] = [];
      const registrosPorDia = new Map<string, typeof registrosMes>();

      registrosMes.forEach(r => {
        const data = r.created_at.split('T')[0];
        if (!registrosPorDia.has(data)) {
          registrosPorDia.set(data, []);
        }
        registrosPorDia.get(data)!.push(r);
      });

      registrosPorDia.forEach((registros, data) => {
        let horasDia = 0;
        const ordenados = registros.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        for (let i = 0; i < ordenados.length - 1; i += 2) {
          if (ordenados[i].tipo_registro === 'entrada' && ordenados[i + 1]?.tipo_registro === 'saida') {
            const entrada = new Date(ordenados[i].created_at);
            const saida = new Date(ordenados[i + 1].created_at);
            horasDia += (saida.getTime() - entrada.getTime()) / (1000 * 60 * 60);
          }
        }

        horasPorDia.push({ data, horas: Math.round(horasDia * 100) / 100 });
      });

      const hojeStr = hoje.toISOString().split('T')[0];
      const horasHoje = horasPorDia.find(h => h.data === hojeStr)?.horas || 0;

      const horasSemana = horasPorDia
        .filter(h => new Date(h.data) >= inicioSemana)
        .reduce((acc, h) => acc + h.horas, 0);

      const horasMes = horasPorDia.reduce((acc, h) => acc + h.horas, 0);

      return {
        horasHoje: Math.round(horasHoje * 100) / 100,
        horasSemana: Math.round(horasSemana * 100) / 100,
        horasMes: Math.round(horasMes * 100) / 100,
        horasPorDia,
      };
    },
    enabled: !!userId,
  });
}
