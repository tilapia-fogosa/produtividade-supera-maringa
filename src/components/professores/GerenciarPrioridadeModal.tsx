import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProfessores } from "@/hooks/use-professores";
import { useAtualizarPrioridadeProfessores } from "@/hooks/use-atualizar-prioridade-professores";
import { ArrowUp, ArrowDown, Save } from "lucide-react";

interface GerenciarPrioridadeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GerenciarPrioridadeModal({ open, onOpenChange }: GerenciarPrioridadeModalProps) {
  const { professores } = useProfessores();
  const atualizarPrioridades = useAtualizarPrioridadeProfessores();
  const [professoresOrdenados, setProfessoresOrdenados] = useState(professores);

  useEffect(() => {
    if (professores.length > 0) {
      setProfessoresOrdenados([...professores]);
    }
  }, [professores]);

  const moverParaCima = (index: number) => {
    if (index === 0) return;
    const novaLista = [...professoresOrdenados];
    [novaLista[index], novaLista[index - 1]] = [novaLista[index - 1], novaLista[index]];
    setProfessoresOrdenados(novaLista);
  };

  const moverParaBaixo = (index: number) => {
    if (index === professoresOrdenados.length - 1) return;
    const novaLista = [...professoresOrdenados];
    [novaLista[index], novaLista[index + 1]] = [novaLista[index + 1], novaLista[index]];
    setProfessoresOrdenados(novaLista);
  };

  const handleSalvar = async () => {
    const professoresComPrioridade = professoresOrdenados.map((prof, index) => ({
      id: prof.id,
      prioridade: index + 1
    }));

    await atualizarPrioridades.mutateAsync(professoresComPrioridade);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Ordem de Prioridade</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-4">
            Organize a ordem de prioridade dos professores. A ordem será usada como padrão ao bloquear horários.
          </p>

          {professoresOrdenados.map((prof, index) => (
            <div key={prof.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <span className="font-medium text-sm w-8">{index + 1}.</span>
              <span className="flex-1">{prof.nome}</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moverParaCima(index)}
                  disabled={index === 0}
                  className="h-8 w-8 p-0"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moverParaBaixo(index)}
                  disabled={index === professoresOrdenados.length - 1}
                  className="h-8 w-8 p-0"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={atualizarPrioridades.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {atualizarPrioridades.isPending ? "Salvando..." : "Salvar Ordem"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}