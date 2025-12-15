import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, User } from "lucide-react";
import { useAhIniciarCorrecao } from "@/hooks/use-ah-iniciar-correcao";
import { useCurrentFuncionario } from "@/hooks/use-current-funcionario";

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
  const { iniciarCorrecao, isLoading } = useAhIniciarCorrecao();
  const { funcionarioId, funcionarioNome, isLoading: loadingFuncionario } = useCurrentFuncionario();

  const [dataInicio, setDataInicio] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });

  const handleSubmit = async () => {
    if (!funcionarioId || !dataInicio) {
      console.error("Funcionário não vinculado ou data não preenchida");
      return;
    }

    try {
      await iniciarCorrecao.mutateAsync({
        apostilaRecolhidaId,
        funcionarioRegistroId: funcionarioId,
        dataInicio,
      });

      // Resetar form e fechar modal
      setDataInicio(() => {
        const now = new Date();
        return now.toISOString().slice(0, 10);
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

          {/* Responsável pela correção - Exibição automática */}
          <div className="space-y-2">
            <Label>Responsável pela correção</Label>
            <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {loadingFuncionario ? 'Carregando...' : funcionarioNome || 'Funcionário não vinculado'}
              </span>
            </div>
          </div>

          {/* Data de início */}
          <div className="space-y-2">
            <Label htmlFor="data-inicio">Data de início *</Label>
            <input
              id="data-inicio"
              type="date"
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
            disabled={isLoading || !funcionarioId || !dataInicio}
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