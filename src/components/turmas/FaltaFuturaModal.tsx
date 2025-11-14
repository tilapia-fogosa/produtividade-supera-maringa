import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Calendar, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFaltasFuturas } from "@/hooks/use-faltas-futuras";
import { useAlunosTurma } from "@/hooks/use-alunos-turma";
import { useResponsaveis } from "@/hooks/use-responsaveis";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FaltaFuturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  turmaId: string;
  unitId: string;
  dataConsulta?: Date;
}

const FaltaFuturaModal: React.FC<FaltaFuturaModalProps> = ({
  isOpen,
  onClose,
  turmaId,
  unitId,
  dataConsulta,
}) => {
  const [pessoaId, setPessoaId] = useState<string>("");
  const [responsavelId, setResponsavelId] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");

  const { criarFaltaFutura } = useFaltasFuturas();
  const { data: alunosTurma, isLoading: loadingAlunos } = useAlunosTurma(turmaId);
  const { responsaveis, isLoading: loadingResponsaveis } = useResponsaveis();

  // Data da falta é fixada para o dia atual (quando o modal é aberto)
  const dataFalta = dataConsulta || new Date();
  const dataFaltaFormatada = format(dataFalta, "dd/MM/yyyy", { locale: ptBR });

  // Alunos da turma
  const pessoasDisponiveis = [
    ...(alunosTurma || []).map(aluno => ({
      id: aluno.id,
      nome: aluno.nome,
      tipo: 'aluno' as const
    }))
    // TODO: Adicionar funcionários da turma quando o hook estiver disponível
  ];

  // Todos os funcionários e professores do sistema (para lista de responsáveis)
  const responsaveisDisponiveis = responsaveis.map(r => ({
    id: r.id,
    nome: r.nome,
    cargo: r.tipo === 'professor' ? 'Professor' : 'Funcionário',
    tipo: r.tipo
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const pessoaSelecionada = pessoasDisponiveis.find(p => p.id === pessoaId);
    const responsavelSelecionado = responsaveisDisponiveis.find(r => r.id === responsavelId);
    
    if (!pessoaSelecionada || !responsavelSelecionado) return;

    criarFaltaFutura.mutate({
      aluno_id: pessoaId, // Campo mantido para compatibilidade com a tabela
      turma_id: turmaId,
      unit_id: unitId,
      data_falta: format(dataFalta, "yyyy-MM-dd"),
      responsavel_aviso_id: responsavelId,
      responsavel_aviso_tipo: responsavelSelecionado.tipo,
      responsavel_aviso_nome: responsavelSelecionado.nome,
      observacoes: observacoes || undefined,
    });

    // Reset form
    setPessoaId("");
    setResponsavelId("");
    setObservacoes("");
    onClose();
  };

  const isFormValid = pessoaId && responsavelId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lançar Falta Futura</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pessoa">Aluno/Funcionário da Turma *</Label>
            <Select value={pessoaId} onValueChange={setPessoaId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma pessoa" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                {loadingAlunos ? (
                  <SelectItem value="loading" disabled>
                    Carregando pessoas...
                  </SelectItem>
                ) : (
                  pessoasDisponiveis.map((pessoa) => (
                    <SelectItem key={pessoa.id} value={pessoa.id}>
                      {pessoa.nome} ({pessoa.tipo === 'aluno' ? 'Aluno' : 'Funcionário'})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data da Falta</Label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{dataFaltaFormatada}</span>
              <span className="text-xs text-muted-foreground">(Data atual)</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável pelo Aviso *</Label>
            <Select value={responsavelId} onValueChange={setResponsavelId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                {loadingResponsaveis ? (
                  <SelectItem value="loading" disabled>
                    Carregando responsáveis...
                  </SelectItem>
                ) : (
                  responsaveisDisponiveis.map((responsavel) => (
                    <SelectItem key={responsavel.id} value={responsavel.id}>
                      {responsavel.nome} - {responsavel.cargo}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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