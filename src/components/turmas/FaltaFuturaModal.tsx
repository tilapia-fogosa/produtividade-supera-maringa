import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Calendar, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFaltasFuturas } from "@/hooks/use-faltas-futuras";
import { useAlunosAtivos } from "@/hooks/use-alunos-ativos";

interface FaltaFuturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  turmaId: string;
  unitId: string;
}

const FaltaFuturaModal: React.FC<FaltaFuturaModalProps> = ({
  isOpen,
  onClose,
  turmaId,
  unitId,
}) => {
  const [alunoId, setAlunoId] = useState<string>("");
  const [dataFalta, setDataFalta] = useState<string>("");
  const [responsavelAvisoId, setResponsavelAvisoId] = useState<string>("");
  const [responsavelAvisoTipo, setResponsavelAvisoTipo] = useState<"professor" | "funcionario">("professor");
  const [responsavelAvisoNome, setResponsavelAvisoNome] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");

  const { criarFaltaFutura } = useFaltasFuturas();
  const { alunos: alunosAtivos, loading: loadingAlunos } = useAlunosAtivos();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    criarFaltaFutura.mutate({
      aluno_id: alunoId,
      turma_id: turmaId,
      unit_id: unitId,
      data_falta: dataFalta,
      responsavel_aviso_id: responsavelAvisoId,
      responsavel_aviso_tipo: responsavelAvisoTipo,
      responsavel_aviso_nome: responsavelAvisoNome,
      observacoes: observacoes || undefined,
    });

    // Reset form
    setAlunoId("");
    setDataFalta("");
    setResponsavelAvisoId("");
    setResponsavelAvisoTipo("professor");
    setResponsavelAvisoNome("");
    setObservacoes("");
    onClose();
  };

  const isFormValid = alunoId && dataFalta && responsavelAvisoId && responsavelAvisoNome;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lançar Falta Futura</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aluno">Aluno *</Label>
            <Select value={alunoId} onValueChange={setAlunoId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um aluno" />
              </SelectTrigger>
              <SelectContent>
                {loadingAlunos ? (
                  <SelectItem value="loading" disabled>
                    Carregando alunos...
                  </SelectItem>
                ) : (
                  alunosAtivos?.map((aluno) => (
                    <SelectItem key={aluno.id} value={aluno.id}>
                      {aluno.nome}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_falta">Data da Falta *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="data_falta"
                type="date"
                value={dataFalta}
                onChange={(e) => setDataFalta(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo do Responsável pelo Aviso *</Label>
            <Select 
              value={responsavelAvisoTipo} 
              onValueChange={(value: "professor" | "funcionario") => setResponsavelAvisoTipo(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professor">Professor</SelectItem>
                <SelectItem value="funcionario">Funcionário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavel_aviso_id">ID do Responsável *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="responsavel_aviso_id"
                value={responsavelAvisoId}
                onChange={(e) => setResponsavelAvisoId(e.target.value)}
                placeholder="Digite o ID do responsável"
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavel_aviso_nome">Nome do Responsável *</Label>
            <Input
              id="responsavel_aviso_nome"
              value={responsavelAvisoNome}
              onChange={(e) => setResponsavelAvisoNome(e.target.value)}
              placeholder="Digite o nome do responsável"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Digite observações sobre a falta futura (opcional)"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={!isFormValid || criarFaltaFutura.isPending}
            >
              {criarFaltaFutura.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Registrar Falta Futura
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FaltaFuturaModal;