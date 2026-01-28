import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { ClienteMatriculado } from "@/hooks/use-pos-matricula";

interface DadosFinaisFormProps {
  cliente: ClienteMatriculado;
  onCancel: () => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  field: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: "lancar_sgs", label: "Lançar SGS", field: "check_lancar_sgs" },
  { id: "assinar_contrato", label: "Assinar Contrato", field: "check_assinar_contrato" },
  { id: "entregar_kit", label: "Entregar Kit", field: "check_entregar_kit" },
  { id: "cadastrar_pagamento", label: "Cadastrar forma de pagamento", field: "check_cadastrar_pagamento" },
  { id: "sincronizar_sgs", label: "Sincronizar dados SGS", field: "check_sincronizar_sgs" },
  { id: "grupo_whatsapp", label: "Adicionar Grupo Whatsapp", field: "check_grupo_whatsapp" },
];

export function DadosFinaisForm({ cliente, onCancel }: DadosFinaisFormProps) {
  const queryClient = useQueryClient();
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    check_lancar_sgs: false,
    check_assinar_contrato: false,
    check_entregar_kit: false,
    check_cadastrar_pagamento: false,
    check_sincronizar_sgs: false,
    check_grupo_whatsapp: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados existentes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase
          .from("atividade_pos_venda")
          .select(`
            check_lancar_sgs,
            check_assinar_contrato,
            check_entregar_kit,
            check_cadastrar_pagamento,
            check_sincronizar_sgs,
            check_grupo_whatsapp
          `)
          .eq("client_id", cliente.id)
          .maybeSingle();

        if (data) {
          setChecklist({
            check_lancar_sgs: data.check_lancar_sgs ?? false,
            check_assinar_contrato: data.check_assinar_contrato ?? false,
            check_entregar_kit: data.check_entregar_kit ?? false,
            check_cadastrar_pagamento: data.check_cadastrar_pagamento ?? false,
            check_sincronizar_sgs: (data as any).check_sincronizar_sgs ?? false,
            check_grupo_whatsapp: data.check_grupo_whatsapp ?? false,
          });
        }
      } catch (error) {
        console.error("Erro ao carregar dados finais:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [cliente.id]);

  const mutation = useMutation({
    mutationFn: async (data: Record<string, boolean>) => {
      const { error } = await supabase
        .from("atividade_pos_venda")
        .update(data)
        .eq("client_id", cliente.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-matricula"] });
      queryClient.invalidateQueries({ queryKey: ["pos-matriculas-incompletas"] });
      setTimeout(() => onCancel(), 1500);
    },
  });

  const handleToggle = (field: string) => {
    setChecklist((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(checklist);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {CHECKLIST_ITEMS.map((item) => (
          <div key={item.id} className="flex items-center space-x-3">
            <Checkbox
              id={item.id}
              checked={checklist[item.field]}
              onCheckedChange={() => handleToggle(item.field)}
            />
            <Label
              htmlFor={item.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {item.label}
            </Label>
          </div>
        ))}
      </div>

      {mutation.isSuccess && (
        <p className="text-sm text-green-600">Dados salvos com sucesso!</p>
      )}

      {mutation.isError && (
        <p className="text-sm text-destructive">Erro ao salvar dados.</p>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending} className="flex-1">
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar"
          )}
        </Button>
      </div>
    </form>
  );
}
