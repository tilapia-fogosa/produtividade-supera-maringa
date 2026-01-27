import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DadosComerciais {
  clientId: string;
  kitType?: string;
  enrollmentAmount?: number;
  enrollmentPaymentDate?: string;
  enrollmentPaymentMethod?: string;
  enrollmentInstallments?: number;
  enrollmentPaymentConfirmed?: boolean;
  monthlyFeeAmount?: number;
  firstMonthlyFeeDate?: string;
  monthlyFeePaymentMethod?: string;
  materialAmount?: number;
  materialPaymentDate?: string;
  materialPaymentMethod?: string;
  materialInstallments?: number;
  materialPaymentConfirmed?: boolean;
}

// Função para converter data DD/MM/AAAA para YYYY-MM-DD
const parseDate = (dateStr: string | undefined): string | null => {
  if (!dateStr || dateStr.length !== 10) return null;
  const [day, month, year] = dateStr.split("/");
  if (!day || !month || !year) return null;
  return `${year}-${month}-${day}`;
};

export function useSalvarDadosComerciais() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DadosComerciais) => {
      const { error } = await supabase
        .from("atividade_pos_venda")
        .update({
          kit_type: input.kitType as any,
          enrollment_amount: input.enrollmentAmount || null,
          enrollment_payment_date: parseDate(input.enrollmentPaymentDate),
          enrollment_payment_method: input.enrollmentPaymentMethod as any,
          enrollment_installments: input.enrollmentInstallments || null,
          enrollment_payment_confirmed: input.enrollmentPaymentConfirmed ?? null,
          monthly_fee_amount: input.monthlyFeeAmount || null,
          first_monthly_fee_date: parseDate(input.firstMonthlyFeeDate),
          monthly_fee_payment_method: input.monthlyFeePaymentMethod as any,
          material_amount: input.materialAmount || null,
          material_payment_date: parseDate(input.materialPaymentDate),
          material_payment_method: input.materialPaymentMethod as any,
          material_installments: input.materialInstallments || null,
          material_payment_confirmed: input.materialPaymentConfirmed ?? null,
        })
        .eq("client_id", input.clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes-matriculados"] });
    },
  });
}
