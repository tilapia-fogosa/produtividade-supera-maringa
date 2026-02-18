import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Save } from "lucide-react";
import { FormulaBlock, useComissaoConfig } from "@/hooks/use-comissao-config";

const VARIABLES = [
  { value: "material", label: "Material" },
  { value: "mensalidade", label: "Mensalidade" },
  { value: "matricula", label: "Matrícula" },
];

const OPERATORS = [
  { value: "+", label: "+" },
  { value: "-", label: "−" },
  { value: "*", label: "×" },
];

let blockIdCounter = 0;
const newId = () => `block_${++blockIdCounter}_${Date.now()}`;

const FormulaBuilder = () => {
  const { config, isLoading, saveFormula } = useComissaoConfig();
  const [blocks, setBlocks] = useState<FormulaBlock[]>([]);

  useEffect(() => {
    if (config?.formula_json?.length) {
      setBlocks(config.formula_json);
    }
  }, [config]);

  const addBlock = (type: FormulaBlock["type"], value: string | number) => {
    setBlocks((prev) => [...prev, { id: newId(), type, value }]);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const updateBlockValue = (id: string, value: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, value: value === "" ? "" : Number(value) || value } : b))
    );
  };

  const handleSave = () => {
    saveFormula.mutate(blocks);
  };

  const getPreview = () => {
    return blocks
      .map((b) => {
        if (b.type === "variable") return b.value;
        if (b.type === "operator") return ` ${b.value} `;
        return String(b.value);
      })
      .join("");
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Fórmula de Comissão</h3>
        <p className="text-sm text-muted-foreground">
          Monte a fórmula usando os blocos abaixo. As variáveis representam os valores de cada matrícula.
        </p>
      </div>

      {/* Botões para adicionar blocos */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-foreground mb-2">Variáveis</p>
          <div className="flex gap-2 flex-wrap">
            {VARIABLES.map((v) => (
              <Button
                key={v.value}
                variant="outline"
                size="sm"
                onClick={() => addBlock("variable", v.value)}
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                <Plus className="h-3 w-3 mr-1" />
                {v.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground mb-2">Operadores</p>
          <div className="flex gap-2">
            {OPERATORS.map((o) => (
              <Button
                key={o.value}
                variant="outline"
                size="sm"
                onClick={() => addBlock("operator", o.value)}
              >
                <Plus className="h-3 w-3 mr-1" />
                {o.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground mb-2">Número</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addBlock("number", 0)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Número
          </Button>
        </div>
      </div>

      {/* Área da fórmula */}
      <div className="border border-border rounded-lg p-4 min-h-[80px] bg-muted/30">
        <p className="text-xs text-muted-foreground mb-3">Fórmula</p>
        {blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Adicione blocos para montar a fórmula
          </p>
        ) : (
          <div className="flex gap-2 flex-wrap items-center">
            {blocks.map((block) => (
              <div
                key={block.id}
                className={`
                  flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium
                  ${block.type === "variable" ? "bg-primary/15 text-primary border border-primary/30" : ""}
                  ${block.type === "operator" ? "bg-muted text-foreground border border-border" : ""}
                  ${block.type === "number" ? "bg-accent/50 text-foreground border border-border" : ""}
                `}
              >
                {block.type === "number" ? (
                  <Input
                    type="number"
                    value={block.value}
                    onChange={(e) => updateBlockValue(block.id, e.target.value)}
                    className="w-20 h-6 text-sm p-1 border-0 bg-transparent"
                    step="any"
                  />
                ) : block.type === "variable" ? (
                  <span className="capitalize">{block.value}</span>
                ) : (
                  <span className="text-lg">{block.value === "*" ? "×" : block.value === "-" ? "−" : block.value}</span>
                )}
                <button
                  onClick={() => removeBlock(block.id)}
                  className="ml-1 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      {blocks.length > 0 && (
        <div className="bg-muted/20 border border-border rounded-md p-3">
          <p className="text-xs text-muted-foreground mb-1">Prévia da fórmula</p>
          <code className="text-sm text-foreground">{getPreview()}</code>
        </div>
      )}

      {/* Salvar */}
      <Button onClick={handleSave} disabled={saveFormula.isPending}>
        <Save className="h-4 w-4 mr-2" />
        {saveFormula.isPending ? "Salvando..." : "Salvar Fórmula"}
      </Button>
    </div>
  );
};

export default FormulaBuilder;
