import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTodasTurmas } from "@/hooks/use-todas-turmas";
import { useResponsaveis } from "@/hooks/use-responsaveis";
import { useReposicoes, calcularDatasValidas } from "@/hooks/use-reposicoes";
import { useAlunosReposicao } from "@/hooks/use-alunos-reposicao";

interface ReposicaoLancamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReposicaoLancamentoModal: React.FC<ReposicaoLancamentoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>("");
  const [alunoSelecionado, setAlunoSelecionado] = useState<string>("");
  const [responsavelSelecionado, setResponsavelSelecionado] = useState<string>("");
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>();
  const [observacoes, setObservacoes] = useState<string>("");

  const { turmas, loading: loadingTurmas } = useTodasTurmas();
  const { responsaveis, isLoading: loadingResponsaveis } = useResponsaveis();
  const { criarReposicao } = useReposicoes();
  const { data: alunos = [], isLoading: loadingAlunos } = useAlunosReposicao(turmaSelecionada);

  // Encontrar turma selecionada
  const turma = turmas.find(t => t.id === turmaSelecionada);
  
  // Calcular datas válidas quando turma estiver selecionada
  const datasValidas = turma ? calcularDatasValidas(turma.dia_semana) : [];

  // Função para determinar o tipo do responsável
  const determinarTipoResponsavel = (responsavelId: string): 'professor' | 'funcionario' => {
    const responsavel = responsaveis.find(r => r.id === responsavelId);
    return responsavel?.tipo || 'professor';
  };

  const handleProximaEtapa = () => {
    if (turmaSelecionada) {
      setEtapa(2);
    }
  };

  const handleVoltarEtapa = () => {
    setEtapa(1);
  };

  const handleSubmit = async () => {
    if (!alunoSelecionado || !responsavelSelecionado || !dataSelecionada || !turma) {
      return;
    }

    try {
      await criarReposicao.mutateAsync({
        aluno_id: alunoSelecionado,
        turma_id: turma.id,
        data_reposicao: format(dataSelecionada, 'yyyy-MM-dd'),
        responsavel_id: responsavelSelecionado,
        responsavel_tipo: determinarTipoResponsavel(responsavelSelecionado),
        observacoes: observacoes || undefined,
        unit_id: turma.unit_id,
        created_by: 'sistema',
      });

      // Resetar form
      setEtapa(1);
      setTurmaSelecionada("");
      setAlunoSelecionado("");
      setResponsavelSelecionado("");
      setDataSelecionada(undefined);
      setObservacoes("");
      onClose();
    } catch (error) {
      console.error('Erro ao salvar reposição:', error);
    }
  };

  const handleClose = () => {
    setEtapa(1);
    setTurmaSelecionada("");
    setAlunoSelecionado("");
    setResponsavelSelecionado("");
    setDataSelecionada(undefined);
    setObservacoes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {etapa === 1 ? "Selecionar Turma para Reposição" : `Registrar Reposição - ${turma?.nome}`}
          </DialogTitle>
        </DialogHeader>

        {etapa === 1 && (
          <div className="space-y-4">
            {/* Seleção da Turma */}
            <div className="space-y-2">
              <Label htmlFor="turma">Turma *</Label>
              <Select 
                value={turmaSelecionada} 
                onValueChange={setTurmaSelecionada}
                disabled={loadingTurmas}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingTurmas ? "Carregando..." : "Selecione a turma"} />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.nome} - {turma.dia_semana}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleProximaEtapa}
                disabled={!turmaSelecionada || loadingTurmas}
                className="flex items-center gap-2"
              >
                Continuar
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {etapa === 2 && turma && (
          <div className="space-y-4">
            {/* Seleção do Aluno */}
            <div className="space-y-2">
              <Label htmlFor="aluno">Aluno *</Label>
              <Select 
                value={alunoSelecionado} 
                onValueChange={setAlunoSelecionado}
                disabled={loadingAlunos}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingAlunos ? "Carregando alunos..." : "Selecione o aluno"} />
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

            {/* Seleção do Responsável */}
            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsável *</Label>
              <Select 
                value={responsavelSelecionado} 
                onValueChange={setResponsavelSelecionado}
                disabled={loadingResponsaveis}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {responsaveis.map((responsavel) => (
                    <SelectItem key={responsavel.id} value={responsavel.id}>
                      {responsavel.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seleção da Data */}
            <div className="space-y-2">
              <Label>Data da Reposição *</Label>
              <div className="border rounded-md p-4">
                <Calendar
                  mode="single"
                  selected={dataSelecionada}
                  onSelect={setDataSelecionada}
                  disabled={(date) => 
                    !datasValidas.some(d => 
                      format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                    )
                  }
                  modifiers={{
                    available: datasValidas,
                    selected: dataSelecionada ? [dataSelecionada] : undefined
                  }}
                  modifiersStyles={{
                    available: { 
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))'
                    },
                    selected: {
                      backgroundColor: 'hsl(var(--secondary))',
                      color: 'hsl(var(--secondary-foreground))',
                      border: '2px solid hsl(var(--secondary))',
                      fontWeight: '600'
                    }
                  }}
                  locale={ptBR}
                  className="w-full"
                />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações adicionais sobre a reposição..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={handleVoltarEtapa}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </Button>
              
              <Button
                onClick={handleSubmit}
                disabled={
                  !alunoSelecionado || 
                  !responsavelSelecionado || 
                  !dataSelecionada || 
                  criarReposicao.isPending
                }
                className="flex items-center gap-2"
              >
                {criarReposicao.isPending ? "Salvando..." : "Salvar Reposição"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};