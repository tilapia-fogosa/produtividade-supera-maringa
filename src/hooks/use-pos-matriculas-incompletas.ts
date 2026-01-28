import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export interface PosMatriculaIncompleta {
  id: string;
  client_id: string;
  client_name: string;
  data_matricula: string;
  vendedor_nome: string | null;
  // Status de cada seção
  cadastrais_completo: boolean;
  comerciais_completo: boolean;
  pedagogicos_completo: boolean;
}

export function usePosMatriculasIncompletas() {
  const { activeUnit } = useActiveUnit();

  return useQuery({
    queryKey: ["pos-matriculas-incompletas", activeUnit?.id],
    queryFn: async (): Promise<PosMatriculaIncompleta[]> => {
      // Buscar atividades de matrícula após 01/01/2026
      let query = supabase
        .from("client_activities")
        .select(`
          id,
          created_at,
          created_by,
          client_id,
          clients!client_activities_client_id_fkey (
            id,
            name
          )
        `)
        .eq("tipo_atividade", "Matrícula")
        .gte("created_at", "2026-01-01T00:00:00")
        .order("created_at", { ascending: false });

      // Filtra por unidade se selecionada
      if (activeUnit?.id) {
        query = query.eq("unit_id", activeUnit.id);
      }

      const { data: activities, error } = await query;

      if (error) throw error;
      if (!activities?.length) return [];

      // Mapear client_ids únicos
      const clientIds = [...new Set(activities.map((a: any) => a.client_id).filter(Boolean))] as string[];
      
      if (clientIds.length === 0) return [];

      // Buscar atividade_pos_venda para verificar completude
      const { data: posVendaData } = await supabase
        .from("atividade_pos_venda")
        .select(`
          id,
          client_id,
          client_name,
          created_at,
          full_name,
          cpf,
          birth_date,
          address_street,
          kit_type,
          enrollment_amount,
          monthly_fee_amount,
          turma_id,
          data_aula_inaugural
        `)
        .in("client_id", clientIds);

      // Buscar nomes dos vendedores
      const createdByIds = [...new Set(
        activities.map((a: any) => a.created_by).filter(Boolean)
      )] as string[];

      let profilesMap = new Map<string, string>();
      if (createdByIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", createdByIds);

        profiles?.forEach((p: any) => {
          profilesMap.set(p.id, p.full_name);
        });
      }

      // Mapear pos_venda por client_id
      const posVendaMap = new Map<string, any>();
      posVendaData?.forEach((pv: any) => {
        posVendaMap.set(pv.client_id, pv);
      });

      // Montar resultado verificando completude
      const clientesMap = new Map<string, any>();
      activities.forEach((activity: any) => {
        const clientId = activity.clients?.id;
        if (!clientId || clientesMap.has(clientId)) return;
        
        const posVenda = posVendaMap.get(clientId);
        
        // Verificar completude de cada seção
        const cadastrais_completo = posVenda && !!(
          posVenda.full_name &&
          posVenda.cpf &&
          posVenda.birth_date &&
          posVenda.address_street
        );
        
        const comerciais_completo = posVenda && !!(
          posVenda.kit_type &&
          posVenda.enrollment_amount !== null &&
          posVenda.monthly_fee_amount !== null
        );
        
        const pedagogicos_completo = posVenda && !!(
          posVenda.turma_id &&
          posVenda.data_aula_inaugural
        );

        // Só adicionar se alguma seção estiver incompleta
        if (!cadastrais_completo || !comerciais_completo || !pedagogicos_completo) {
          clientesMap.set(clientId, {
            id: posVenda?.id || activity.id,
            client_id: clientId,
            client_name: activity.clients.name || "Sem nome",
            data_matricula: activity.created_at,
            vendedor_nome: activity.created_by ? profilesMap.get(activity.created_by) || null : null,
            cadastrais_completo,
            comerciais_completo,
            pedagogicos_completo,
          });
        }
      });

      return Array.from(clientesMap.values());
    },
    enabled: true,
  });
}
