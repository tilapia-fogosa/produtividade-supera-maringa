import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DadosPosVenda {
  // Dados cadastrais
  birth_date: string | null;
  cpf: string | null;
  rg: string | null;
  whatsapp_contato: string | null;
  address_postal_code: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  // Dados comerciais
  kit_type: string | null;
  enrollment_amount: number | null;
  enrollment_payment_date: string | null;
  enrollment_payment_method: string | null;
  enrollment_installments: number | null;
  enrollment_payment_confirmed: boolean | null;
  monthly_fee_amount: number | null;
  first_monthly_fee_date: string | null;
  monthly_fee_payment_method: string | null;
  material_amount: number | null;
  material_payment_date: string | null;
  material_payment_method: string | null;
  material_installments: number | null;
  material_payment_confirmed: boolean | null;
  // Dados pedagógicos
  turma_id: string | null;
  responsavel: string | null;
  data_aula_inaugural: string | null;
}

// Formata data ISO (YYYY-MM-DD) para formato brasileiro (DD/MM/AAAA)
export function formatDateToBR(isoDate: string | null): string {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return "";
  return `${day}/${month}/${year}`;
}

// Formata valor numérico para moeda brasileira
export function formatNumberToCurrency(value: number | null): string {
  if (value === null || value === undefined) return "R$ 0,00";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Formata CPF para exibição (000.000.000-00)
export function formatCPFDisplay(cpf: string | null): string {
  if (!cpf) return "";
  const digits = cpf.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

// Formata CEP para exibição (00000-000)
export function formatCEPDisplay(cep: string | null): string {
  if (!cep) return "";
  const digits = cep.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, "$1-$2");
}

// Formata telefone para exibição
export function formatPhoneDisplay(phone: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

export function useDadosPosVenda(atividadePosVendaId?: string) {
  return useQuery({
    queryKey: ["dados-pos-venda", atividadePosVendaId],
    queryFn: async (): Promise<DadosPosVenda | null> => {
      if (!atividadePosVendaId) return null;

      const { data, error } = await supabase
        .from("atividade_pos_venda")
        .select(`
          birth_date,
          cpf,
          rg,
          whatsapp_contato,
          address_postal_code,
          address_street,
          address_number,
          address_complement,
          address_neighborhood,
          address_city,
          address_state,
          kit_type,
          enrollment_amount,
          enrollment_payment_date,
          enrollment_payment_method,
          enrollment_installments,
          enrollment_payment_confirmed,
          monthly_fee_amount,
          first_monthly_fee_date,
          monthly_fee_payment_method,
          material_amount,
          material_payment_date,
          material_payment_method,
          material_installments,
          material_payment_confirmed,
          turma_id,
          responsavel,
          data_aula_inaugural
        `)
        .eq("id", atividadePosVendaId)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar dados pós-venda:", error);
        return null;
      }

      return data;
    },
    enabled: !!atividadePosVendaId,
  });
}
