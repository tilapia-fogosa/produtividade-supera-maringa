import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Save, Trash2 } from "lucide-react";
import { Acelerador, useComissaoConfig } from "@/hooks/use-comissao-config";

let aceleradorIdCounter = 0;
const newAceleradorId = () => `acel_${++aceleradorIdCounter}_${Date.now()}`;

const AceleradoresEditor = () => {
  const { config, isLoading, saveAceleradores } = useComissaoConfig();
  const [aceleradores, setAceleradores] = useState<Acelerador[]>([]);

  useEffect(() => {
    if (config?.aceleradores?.length) {
      setAceleradores(config.aceleradores);
    }
  }, [config]);

  const addAcelerador = () => {
    // Encontrar o maior percentual atual para sugerir o próximo
    const maxPct = aceleradores.reduce((max, a) => {
      return a.ate_percentual !== null && a.ate_percentual > max ? a.ate_percentual : max;
    }, 0);

    setAceleradores((prev) => [
      ...prev,
      {
        id: newAceleradorId(),
        ate_percentual: maxPct > 0 ? maxPct + 20 : 119,
        multiplicador: 1,
        label: "",
      },
    ]);
  };

  const removeAcelerador = (id: string) => {
    setAceleradores((prev) => prev.filter((a) => a.id !== id));
  };

  const updateAcelerador = (id: string, field: keyof Acelerador, value: any) => {
    setAceleradores((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const handleSave = () => {
    // Auto-gerar labels
    const sorted = [...aceleradores].sort((a, b) => (a.ate_percentual ?? Infinity) - (b.ate_percentual ?? Infinity));
    const withLabels = sorted.map((a, i) => {
      const prevPct = i > 0 ? (sorted[i - 1].ate_percentual ?? 0) + 1 : 0;
      const label = a.ate_percentual !== null
        ? `${prevPct > 0 ? prevPct : "até "}${prevPct > 0 ? "-" : ""}${a.ate_percentual}% da Meta`
        : `${prevPct}%+ da Meta`;
      return { ...a, label };
    });
    saveAceleradores.mutate(withLabels);
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Aceleradores</h3>
        <p className="text-sm text-muted-foreground">
          Defina multiplicadores de comissão baseados no percentual da meta atingida. 
          Ordene do menor para o maior percentual. O último item pode ser "sem limite" (ilimitado).
        </p>
      </div>

      {aceleradores.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Nenhum acelerador configurado. A comissão será aplicada sem multiplicador.
        </p>
      ) : (
        <div className="space-y-3">
          {aceleradores.map((acel, index) => (
            <div
              key={acel.id}
              className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/20"
            >
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Até</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={acel.ate_percentual ?? ""}
                    onChange={(e) =>
                      updateAcelerador(
                        acel.id,
                        "ate_percentual",
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                    className="w-20 h-8 text-sm"
                    placeholder="∞"
                  />
                  <span className="text-sm text-muted-foreground">% da Meta</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Multiplicador</span>
                <Input
                  type="number"
                  value={acel.multiplicador}
                  onChange={(e) =>
                    updateAcelerador(acel.id, "multiplicador", Number(e.target.value) || 1)
                  }
                  className="w-20 h-8 text-sm"
                  step="0.01"
                />
                <span className="text-sm text-muted-foreground">x</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeAcelerador(acel.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={addAcelerador}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Acelerador
        </Button>

        {aceleradores.length > 0 && (
          <Button size="sm" onClick={handleSave} disabled={saveAceleradores.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {saveAceleradores.isPending ? "Salvando..." : "Salvar Aceleradores"}
          </Button>
        )}
      </div>

      {/* Preview dos aceleradores */}
      {aceleradores.length > 0 && (
        <div className="bg-muted/20 border border-border rounded-md p-3">
          <p className="text-xs text-muted-foreground mb-2">Prévia</p>
          <div className="space-y-1">
            {[...aceleradores]
              .sort((a, b) => (a.ate_percentual ?? Infinity) - (b.ate_percentual ?? Infinity))
              .map((a, i, arr) => {
                const prevPct = i > 0 ? (arr[i - 1].ate_percentual ?? 0) + 1 : 0;
                const range = a.ate_percentual !== null
                  ? `${prevPct > 0 ? `${prevPct}-` : "até "}${a.ate_percentual}%`
                  : `${prevPct}%+`;
                return (
                  <p key={a.id} className="text-sm text-foreground">
                    {range} da Meta: comissão × <span className="font-semibold text-primary">{a.multiplicador}</span>
                  </p>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AceleradoresEditor;
