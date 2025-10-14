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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useProfessores } from "@/hooks/use-professores";
import { useAhCorrecao } from "@/hooks/use-ah-correcao";
import { BookOpen } from "lucide-react";

interface CorrecaoAhModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apostilaRecolhidaId: string;
  pessoaId: string;
  pessoaNome: string;
  apostilaNome: string;
}

export function CorrecaoAhModal({
  open,
  onOpenChange,
  apostilaRecolhidaId,
  pessoaId,
  pessoaNome,
  apostilaNome,
}: CorrecaoAhModalProps) {
  const { professores } = useProfessores();
  const { registrarCorrecaoAH, isLoading } = useAhCorrecao();

  const [exercicios, setExercicios] = useState("");
  const [erros, setErros] = useState("");
  const [professorCorrecao, setProfessorCorrecao] = useState("");
  const [dataFimCorrecao, setDataFimCorrecao] = useState("");
  const [comentario, setComentario] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await registrarCorrecaoAH.mutateAsync({
      apostilaRecolhidaId,
      pessoaId,
      apostilaNome,
      exercicios: parseInt(exercicios),
      erros: parseInt(erros),
      professorCorrecao,
      dataFimCorrecao,
      comentario,
    });

    // Limpar formulário e fechar modal
    setExercicios("");
    setErros("");
    setProfessorCorrecao("");
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
            Correção de Apostila - {pessoaNome}
          </DialogTitle>
          <DialogDescription>
            Registre a correção da apostila recolhida
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

          {/* Quem corrigiu */}
          <div className="space-y-2">
            <Label htmlFor="professor">
              Quem corrigiu <span className="text-destructive">*</span>
            </Label>
            <Select value={professorCorrecao} onValueChange={setProfessorCorrecao} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o corretor" />
              </SelectTrigger>
              <SelectContent>
                {professores.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data do fim da correção - OBRIGATÓRIO */}
          <div className="space-y-2">
            <Label htmlFor="dataFim">
              Data do Fim da Correção <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dataFim"
              type="datetime-local"
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Correção"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
