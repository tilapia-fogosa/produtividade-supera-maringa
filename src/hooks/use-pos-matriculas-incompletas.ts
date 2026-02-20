import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export interface PosMatriculaIncompleta {
  id: string;
  client_id: string;
  client_name: string;
  data_matricula: string;
  vendedor_nome: string | null;
  cadastrais_completo: boolean;
  comerciais_completo: boolean;
  pedagogicos_completo: boolean;
}

export function usePosMatriculasIncompletas() {
  const { activeUnit } = useActiveUnit();

  return useQuery({
    queryKey: ["pos-matriculas-incompletas", activeUnit?.id],
    queryFn: async (): Promise<PosMatriculaIncompleta[]> => {
      // Buscar direto da atividade_pos_venda (apenas registros que realmente existem)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase
        .from("atividade_pos_venda")
        .select(`
          id,
          client_id,
          client_name,
          created_at,
          created_by,
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
          check_grupo_whatsapp,
          status_manual
        `) as any)
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (activeUnit?.id) {
        query = query.eq("unit_id", activeUnit.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data?.length) return [];

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

      // Montar resultado verificando completude
      const result: PosMatriculaIncompleta[] = [];

      data.forEach((pv: any) => {
        const isManualCompleto = pv.status_manual === 'Concluido';

        const cadastrais_completo = isManualCompleto || !!(
          pv.full_name &&
          pv.cpf &&
          pv.birth_date &&
          pv.address_street
        );

        const comerciais_completo = isManualCompleto || !!(
          pv.kit_type &&
          pv.enrollment_amount !== null &&
          pv.monthly_fee_amount !== null
        );

        const pedagogicos_completo = isManualCompleto || !!(
          pv.turma_id &&
          pv.data_aula_inaugural
        );

        // Só adicionar se alguma seção estiver incompleta
        if (!cadastrais_completo || !comerciais_completo || !pedagogicos_completo) {
          result.push({
            id: pv.id,
            client_id: pv.client_id,
            client_name: pv.full_name || pv.client_name || "Sem nome",
            data_matricula: pv.created_at,
            vendedor_nome: pv.created_by ? profilesMap.get(pv.created_by) || null : null,
            cadastrais_completo,
            comerciais_completo,
            pedagogicos_completo,
          });
        }
      });

      return result;
    },
    enabled: !!activeUnit?.id,
  });
}
