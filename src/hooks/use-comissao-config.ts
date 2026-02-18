import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

export interface FormulaBlock {
  id: string;
  type: "number" | "variable" | "operator";
  value: string | number;
}

export interface Acelerador {
  id: string;
  ate_percentual: number | null; // null = sem limite superior (ex: "171%+")
  multiplicador: number;
  label: string;
}

export interface ComissaoConfig {
  id: string;
  unit_id: string;
  formula_json: FormulaBlock[];
  formula_display: string;
  aceleradores: Acelerador[];
}

const DEFAULT_FORMULA: FormulaBlock[] = [
  { id: "df1", type: "operator", value: "(" },
  { id: "df2", type: "operator", value: "(" },
  { id: "df3", type: "number", value: 18 },
  { id: "df4", type: "operator", value: "*" },
  { id: "df5", type: "variable", value: "mensalidade" },
  { id: "df6", type: "operator", value: ")" },
  { id: "df7", type: "operator", value: "+" },
  { id: "df8", type: "variable", value: "material" },
  { id: "df9", type: "operator", value: "+" },
  { id: "df10", type: "variable", value: "matricula" },
  { id: "df11", type: "operator", value: ")" },
  { id: "df12", type: "operator", value: "*" },
  { id: "df13", type: "number", value: 0.2 },
];

export function useComissaoConfig() {
  const { activeUnit } = useActiveUnit();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["comissao-config", activeUnit?.id],
    queryFn: async (): Promise<ComissaoConfig | null> => {
      const { data, error } = await (supabase
        .from("comissao_config")
        .select("id, unit_id, formula_json, formula_display, aceleradores")
        .eq("unit_id", activeUnit!.id)
        .maybeSingle() as any);

      if (error) throw error;
      if (!data) {
        // Retorna config padrão quando não existe
        return {
          id: "",
          unit_id: activeUnit!.id,
          formula_json: DEFAULT_FORMULA,
          formula_display: "((18 * mensalidade) + material + matricula) * 0.2",
          aceleradores: [],
        };
      }

      return {
        ...data,
        formula_json: (data.formula_json?.length ? data.formula_json : DEFAULT_FORMULA) as FormulaBlock[],
        aceleradores: (data.aceleradores || []) as Acelerador[],
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

  const saveAceleradores = useMutation({
    mutationFn: async (aceleradores: Acelerador[]) => {
      const existing = query.data;

      if (existing) {
        const { error } = await (supabase
          .from("comissao_config")
          .update({
            aceleradores: aceleradores as any,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id) as any);
        if (error) throw error;
      } else {
        const { error } = await (supabase
          .from("comissao_config")
          .insert({
            unit_id: activeUnit!.id,
            formula_json: [] as any,
            formula_display: "",
            aceleradores: aceleradores as any,
          }) as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comissao-config", activeUnit?.id] });
    },
  });

  return { config: query.data, isLoading: query.isLoading, saveFormula, saveAceleradores };
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
