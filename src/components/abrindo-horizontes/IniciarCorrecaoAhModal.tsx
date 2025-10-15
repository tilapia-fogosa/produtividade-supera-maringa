import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useProfessores } from "@/hooks/use-professores";
import { useEstagiarios } from "@/hooks/use-estagiarios";
import { useAhIniciarCorrecao } from "@/hooks/use-ah-iniciar-correcao";

interface IniciarCorrecaoAhModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apostilaRecolhidaId: string;
  pessoaId: string;
  pessoaNome: string;
  apostilaNome: string;
}

export const IniciarCorrecaoAhModal = ({
  open,
  onOpenChange,
  apostilaRecolhidaId,
  apostilaNome,
}: IniciarCorrecaoAhModalProps) => {
  const { professores = [] } = useProfessores();
  const { estagiarios = [] } = useEstagiarios();
  const { iniciarCorrecao, isLoading } = useAhIniciarCorrecao();

  const [responsavelId, setResponsavelId] = useState("");
  const [dataInicio, setDataInicio] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  // Combinar professores e estagiários em uma lista única
  const corretores = useMemo(() => {
    const professoresList = professores.map((p) => ({
      id: p.id,
      nome: p.nome,
      tipo: "Professor" as const,
    }));

    const estagiariosList = estagiarios.map((e) => ({
      id: e.id,
      nome: e.nome,
      tipo: "Estagiário" as const,
    }));

    return [...professoresList, ...estagiariosList].sort((a, b) =>
      a.nome.localeCompare(b.nome)
    );
  }, [professores, estagiarios]);

  const handleSubmit = async () => {
    if (!responsavelId || !dataInicio) {
      console.error("Preencha todos os campos obrigatórios");
      return;
    }

    const corretor = corretores.find((c) => c.id === responsavelId);
    if (!corretor) {
      console.error("Corretor não encontrado");
      return;
    }

    try {
      await iniciarCorrecao.mutateAsync({
        apostilaRecolhidaId,
        responsavelId: corretor.id,
        responsavelNome: corretor.nome,
        responsavelTipo: corretor.tipo,
        dataInicio,
      });

      // Resetar form e fechar modal
      setResponsavelId("");
      setDataInicio(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao iniciar correção:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Iniciar Correção</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Apostila */}
          <div className="space-y-2">
            <Label>Apostila</Label>
            <Badge variant="outline" className="text-sm">
              {apostilaNome}
            </Badge>
          </div>

          {/* Responsável pela correção */}
          <div className="space-y-2">
            <Label htmlFor="responsavel-correcao">
              Responsável pela correção *
            </Label>
            <Select value={responsavelId} onValueChange={setResponsavelId}>
              <SelectTrigger id="responsavel-correcao">
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {corretores.map((corretor) => (
                  <SelectItem key={corretor.id} value={corretor.id}>
                    {corretor.nome} ({corretor.tipo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data de início */}
          <div className="space-y-2">
            <Label htmlFor="data-inicio">Data de início *</Label>
            <input
              id="data-inicio"
              type="datetime-local"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !responsavelId || !dataInicio}
            className="bg-[#4E2CA3] hover:bg-[#4E2CA3]/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Iniciar Correção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
