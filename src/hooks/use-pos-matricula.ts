import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export interface ClienteMatriculado {
  id: string;
  name: string;
  data_matricula: string;
  created_by: string | null;
  vendedor_nome: string | null;
  // Status de cada seção
  cadastrais_completo: boolean;
  comerciais_completo: boolean;
  pedagogicos_completo: boolean;
  finais_completo: boolean;
}

export interface PosMatriculaFilters {
  dataInicio?: Date;
  dataFim?: Date;
  statusConclusao?: 'todos' | 'concluido' | 'pendente';
}

export function usePosMatricula(filters?: PosMatriculaFilters) {
  const { activeUnit } = useActiveUnit();

  return useQuery({
    queryKey: ["pos-matricula", activeUnit, filters],
    queryFn: async (): Promise<ClienteMatriculado[]> => {
      // Busca atividades de matrícula após 01/01/2026
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

      // Filtro de data início
      if (filters?.dataInicio) {
        const startDate = new Date(filters.dataInicio);
        startDate.setHours(0, 0, 0, 0);
        query = query.gte("created_at", startDate.toISOString());
      }

      // Filtro de data fim
      if (filters?.dataFim) {
        const endDate = new Date(filters.dataFim);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data?.length) return [];

      // Mapear client_ids únicos
      const clientIds = [...new Set(data.map((a: any) => a.client_id).filter(Boolean))] as string[];

      // Buscar atividade_pos_venda para verificar completude
      const { data: posVendaData } = await supabase
        .from("atividade_pos_venda")
        .select(`
          id,
          client_id,
          full_name,
          cpf,
          birth_date,
          address_street,
          kit_type,
          enrollment_amount,
          monthly_fee_amount,
          turma_id,
          data_aula_inaugural,
          check_lancar_sgs,
          check_assinar_contrato,
          check_entregar_kit,
          check_cadastrar_pagamento,
          check_sincronizar_sgs,
          check_grupo_whatsapp
        `)
        .in("client_id", clientIds);

      // Buscar nomes dos vendedores
      const createdByIds = [...new Set(
        data.map((a: any) => a.created_by).filter(Boolean)
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

      // Montar resultado com status de cada seção
      const clientesMap = new Map<string, ClienteMatriculado>();
      data.forEach((activity: any) => {
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

        const finais_completo = posVenda && !!(
          posVenda.check_lancar_sgs &&
          posVenda.check_assinar_contrato &&
          posVenda.check_entregar_kit &&
          posVenda.check_cadastrar_pagamento &&
          (posVenda as any).check_sincronizar_sgs &&
          posVenda.check_grupo_whatsapp
        );

        clientesMap.set(clientId, {
          id: clientId,
          name: activity.clients.name || "Sem nome",
          data_matricula: activity.created_at,
          created_by: activity.created_by,
          vendedor_nome: activity.created_by ? profilesMap.get(activity.created_by) || null : null,
          cadastrais_completo,
          comerciais_completo,
          pedagogicos_completo,
          finais_completo,
        });
      });

      // Aplicar filtro de status de conclusão
      let result = Array.from(clientesMap.values());

      if (filters?.statusConclusao === 'concluido') {
        result = result.filter(c => 
          c.cadastrais_completo && 
          c.comerciais_completo && 
          c.pedagogicos_completo && 
          c.finais_completo
        );
      } else if (filters?.statusConclusao === 'pendente') {
        result = result.filter(c => 
          !c.cadastrais_completo || 
          !c.comerciais_completo || 
          !c.pedagogicos_completo || 
          !c.finais_completo
        );
      }

      return result;
    },
    enabled: true,
  });
}
