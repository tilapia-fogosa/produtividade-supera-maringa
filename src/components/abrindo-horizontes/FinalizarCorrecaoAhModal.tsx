import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAhCorrecao } from "@/hooks/use-ah-correcao";
import { useCurrentUser } from "@/hooks/use-current-user";
import { BookOpen, User } from "lucide-react";

interface FinalizarCorrecaoAhModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apostilaRecolhidaId: string;
  pessoaId: string;
  pessoaNome: string;
  apostilaNome: string;
}

export function FinalizarCorrecaoAhModal({
  open,
  onOpenChange,
  apostilaRecolhidaId,
  pessoaId,
  pessoaNome,
  apostilaNome,
}: FinalizarCorrecaoAhModalProps) {
  const { registrarCorrecaoAH, isLoading } = useAhCorrecao();
  const { userId, userName, isLoading: loadingUser, isAuthenticated } = useCurrentUser();

  const [exercicios, setExercicios] = useState("");
  const [erros, setErros] = useState("");
  const [dataFimCorrecao, setDataFimCorrecao] = useState("");
  const [comentario, setComentario] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      return;
    }

    await registrarCorrecaoAH.mutateAsync({
      apostilaRecolhidaId,
      pessoaId,
      apostilaNome,
      exercicios: parseInt(exercicios),
      erros: parseInt(erros),
      funcionarioRegistroId: userId,
      dataFimCorrecao,
      comentario,
    });

    // Limpar formulário e fechar modal
    setExercicios("");
    setErros("");
    setDataFimCorrecao("");
    setComentario("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Finalizar Correção - {pessoaNome}
          </DialogTitle>
          <DialogDescription>
            Complete o registro da correção da apostila recolhida
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Apostila - Readonly */}
          <div className="space-y-2">
            <Label>Apostila</Label>
            <Badge variant="secondary" className="w-full justify-center py-2 text-white">
              {apostilaNome}
            </Badge>
          </div>

          {/* Exercícios realizados */}
          <div className="space-y-2">
            <Label htmlFor="exercicios">
              Exercícios realizados <span className="text-destructive">*</span>
            </Label>
            <Input
              id="exercicios"
              type="number"
              min="1"
              value={exercicios}
              onChange={(e) => setExercicios(e.target.value)}
              placeholder="Número de exercícios"
              required
            />
          </div>

          {/* Número de erros */}
          <div className="space-y-2">
            <Label htmlFor="erros">
              Número de erros <span className="text-destructive">*</span>
            </Label>
            <Input
              id="erros"
              type="number"
              min="0"
              value={erros}
              onChange={(e) => setErros(e.target.value)}
              placeholder="Quantidade de erros"
              required
            />
          </div>

          {/* Quem corrigiu - Exibição automática */}
          <div className="space-y-2">
            <Label>Quem corrigiu</Label>
            <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {loadingUser ? 'Carregando...' : userName || 'Usuário não identificado'}
              </span>
            </div>
          </div>

          {/* Data do fim da correção - OBRIGATÓRIO */}
          <div className="space-y-2">
            <Label htmlFor="dataFim">
              Data do Fim da Correção <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dataFim"
              type="date"
              value={dataFimCorrecao}
              onChange={(e) => setDataFimCorrecao(e.target.value)}
              required
            />
          </div>

          {/* Comentários */}
          <div className="space-y-2">
            <Label htmlFor="comentario">Comentários (opcional)</Label>
            <Textarea
              id="comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Observações sobre a correção..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !isAuthenticated}>
              {isLoading ? "Salvando..." : "Salvar Correção"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}