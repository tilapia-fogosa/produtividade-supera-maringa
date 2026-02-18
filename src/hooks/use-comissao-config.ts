import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export interface FormulaBlock {
  id: string;
  type: "number" | "variable" | "operator";
  value: string | number;
}

export interface ComissaoConfig {
  id: string;
  unit_id: string;
  formula_json: FormulaBlock[];
  formula_display: string;
}

export function useComissaoConfig() {
  const { activeUnit } = useActiveUnit();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["comissao-config", activeUnit?.id],
    queryFn: async (): Promise<ComissaoConfig | null> => {
      const { data, error } = await (supabase
        .from("comissao_config")
        .select("id, unit_id, formula_json, formula_display")
        .eq("unit_id", activeUnit!.id)
        .maybeSingle() as any);

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        formula_json: (data.formula_json || []) as FormulaBlock[],
      };
    },
    enabled: !!activeUnit?.id,
  });

  const saveFormula = useMutation({
    mutationFn: async (blocks: FormulaBlock[]) => {
      const display = blocks
        .map((b) => {
          if (b.type === "variable") return b.value;
          if (b.type === "operator") return ` ${b.value} `;
          return String(b.value);
        })
        .join("");

      const existing = query.data;

      if (existing) {
        const { error } = await (supabase
          .from("comissao_config")
          .update({
            formula_json: blocks as any,
            formula_display: display,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id) as any);
        if (error) throw error;
      } else {
        const { error } = await (supabase
          .from("comissao_config")
          .insert({
            unit_id: activeUnit!.id,
            formula_json: blocks as any,
            formula_display: display,
          }) as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comissao-config", activeUnit?.id] });
    },
  });

  return { config: query.data, isLoading: query.isLoading, saveFormula };
}

// Avaliar fórmula para um item
export function evaluateFormula(
  blocks: FormulaBlock[],
  values: { material: number; mensalidade: number; matricula: number }
): number {
  if (!blocks.length) return 0;

  // Converter blocos para string de expressão
  const expression = blocks
    .map((b) => {
      if (b.type === "variable") {
        const key = b.value as keyof typeof values;
        return String(values[key] || 0);
      }
      if (b.type === "operator") return b.value;
      return String(b.value);
    })
    .join(" ");

  try {
    // Avaliar expressão matemática de forma segura (apenas números e operadores)
    const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, "");
    if (!sanitized.trim()) return 0;
    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${sanitized});`)();
    return typeof result === "number" && isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
}
