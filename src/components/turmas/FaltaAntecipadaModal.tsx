import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useFaltasAntecipadas } from "@/hooks/use-faltas-antecipadas";
import { useResponsaveis } from "@/hooks/use-responsaveis";

interface FaltaAntecipadaModalProps {
  isOpen: boolean;
  onClose: () => void;
  alunos: Array<{
    id: string;
    nome: string;
  }>;
  turmaId: string;
  unitId: string;
  dataConsulta?: Date;
}

const FaltaAntecipadaModal: React.FC<FaltaAntecipadaModalProps> = ({
  isOpen,
  onClose,
  alunos,
  turmaId,
  unitId,
  dataConsulta
}) => {
  const [selectedAluno, setSelectedAluno] = useState<string>("");
  const [selectedResponsavel, setSelectedResponsavel] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(dataConsulta);
  const [observacoes, setObservacoes] = useState<string>("");
  
  const { criarFaltaAntecipada } = useFaltasAntecipadas();
  const { responsaveis, isLoading: isLoadingResponsaveis } = useResponsaveis();

  const handleSubmit = () => {
    if (!selectedAluno || !selectedResponsavel || !selectedDate) {
      return;
    }

    const responsavel = responsaveis.find(r => r.id === selectedResponsavel);
    if (!responsavel) return;

    criarFaltaAntecipada.mutate({
      aluno_id: selectedAluno,
      turma_id: turmaId,
      data_falta: format(selectedDate, 'yyyy-MM-dd'),
      responsavel_aviso_id: responsavel.id,
      responsavel_aviso_tipo: responsavel.tipo,
      responsavel_aviso_nome: responsavel.nome,
      observacoes: observacoes || undefined,
      unit_id: unitId,
    });

    // Reset form
    setSelectedAluno("");
    setSelectedResponsavel("");
    setSelectedDate(dataConsulta);
    setObservacoes("");
    onClose();
  };

  const isFormValid = selectedAluno && selectedResponsavel && selectedDate;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lançar Falta Antecipada</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Aluno */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Aluno</label>
            <Select value={selectedAluno} onValueChange={setSelectedAluno}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o aluno" />
              </SelectTrigger>
              <SelectContent>
                {alunos.map((aluno) => (
                  <SelectItem key={aluno.id} value={aluno.id}>
                    {aluno.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data da Falta */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Data da Falta</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < tomorrow}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Responsável pelo Aviso */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Responsável pelo Aviso</label>
            <Select 
              value={selectedResponsavel} 
              onValueChange={setSelectedResponsavel}
              disabled={isLoadingResponsaveis}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {responsaveis.map((responsavel) => (
                  <SelectItem key={responsavel.id} value={responsavel.id}>
                    {responsavel.nome} ({responsavel.tipo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Observações</label>
            <Textarea
              placeholder="Motivo da falta, observações adicionais..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!isFormValid || criarFaltaAntecipada.isPending}
            >
              {criarFaltaAntecipada.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Registrar Falta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FaltaAntecipadaModal;