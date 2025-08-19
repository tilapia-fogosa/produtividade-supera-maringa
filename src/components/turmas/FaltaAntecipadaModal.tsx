import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  const [observacoes, setObservacoes] = useState<string>("");
  
  const { criarFaltaAntecipada } = useFaltasAntecipadas();
  const { responsaveis, isLoading: isLoadingResponsaveis } = useResponsaveis();

  const handleSubmit = () => {
    if (!selectedAluno || !selectedResponsavel || !dataConsulta) {
      return;
    }

    const responsavel = responsaveis.find(r => r.id === selectedResponsavel);
    if (!responsavel) return;

    criarFaltaAntecipada.mutate({
      aluno_id: selectedAluno,
      turma_id: turmaId,
      data_falta: format(dataConsulta, 'yyyy-MM-dd'),
      responsavel_aviso_id: responsavel.id,
      responsavel_aviso_tipo: responsavel.tipo,
      responsavel_aviso_nome: responsavel.nome,
      observacoes: observacoes || undefined,
      unit_id: unitId,
    });

    // Reset form
    setSelectedAluno("");
    setSelectedResponsavel("");
    setObservacoes("");
    onClose();
  };

  const isFormValid = selectedAluno && selectedResponsavel && dataConsulta;

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

          {/* Data da Falta (Fixa) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Data da Falta</label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">
                {dataConsulta ? format(dataConsulta, "PPP", { locale: ptBR }) : "Data não informada"}
              </p>
            </div>
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