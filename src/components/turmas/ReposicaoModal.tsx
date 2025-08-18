import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useAlunos } from "@/hooks/use-alunos";
import { useResponsaveis } from "@/hooks/use-responsaveis";
import { useReposicoes, calcularDatasValidas } from "@/hooks/use-reposicoes";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface Turma {
  id: string;
  nome: string;
  dia_semana: string;
  unit_id: string;
}

interface ReposicaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  turma: Turma;
}

const ReposicaoModal: React.FC<ReposicaoModalProps> = ({
  isOpen,
  onClose,
  turma,
}) => {
  const isMobile = useIsMobile();
  const { alunos } = useAlunos();
  const { responsaveis } = useResponsaveis();
  const { criarReposicao } = useReposicoes();

  const [alunoSelecionado, setAlunoSelecionado] = useState<string>("");
  const [responsavelSelecionado, setResponsavelSelecionado] = useState<string>("");
  const [dataFalta, setDataFalta] = useState<Date | undefined>();
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>();
  const [observacoes, setObservacoes] = useState<string>("");

  // Calcular datas válidas baseadas no dia da semana da turma
  const datasValidas = calcularDatasValidas(turma.dia_semana);
  
  // Função para determinar o tipo do responsável
  const determinarTipoResponsavel = (responsavelId: string): 'professor' | 'funcionario' => {
    const responsavel = responsaveis.find(r => r.id === responsavelId);
    return responsavel?.tipo || 'professor';
  };
  
  const handleSubmit = async () => {
    if (!alunoSelecionado || !responsavelSelecionado || !dataSelecionada) {
      return;
    }

    // Encontrar o nome do responsável selecionado
    const responsavelSelecionadoObj = responsaveis.find(r => r.id === responsavelSelecionado);
    const nomeResponsavel = responsavelSelecionadoObj?.nome || '';

    try {
      await criarReposicao.mutateAsync({
        aluno_id: alunoSelecionado,
        turma_id: turma.id,
        data_reposicao: format(dataSelecionada, 'yyyy-MM-dd'),
        data_falta: dataFalta ? format(dataFalta, 'yyyy-MM-dd') : undefined,
        responsavel_id: responsavelSelecionado,
        responsavel_tipo: determinarTipoResponsavel(responsavelSelecionado),
        nome_responsavel: nomeResponsavel,
        observacoes: observacoes || undefined,
        unit_id: turma.unit_id,
        created_by: 'sistema', // Por enquanto fixo, pois não há login
      });

      // Resetar form
      setAlunoSelecionado("");
      setResponsavelSelecionado("");
      setDataFalta(undefined);
      setDataSelecionada(undefined);
      setObservacoes("");
      onClose();
    } catch (error) {
      console.error('Erro ao salvar reposição:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-2xl max-h-[90vh] overflow-y-auto", isMobile && "max-w-[95vw]")}>
        <DialogHeader>
          <DialogTitle className="text-azul-500">
            Registrar Reposição - {turma.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seleção do Aluno */}
          <div className="space-y-2">
            <Label htmlFor="aluno">Aluno *</Label>
            <Select value={alunoSelecionado} onValueChange={setAlunoSelecionado}>
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

          {/* Seleção do Responsável */}
          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável *</Label>
            <Select 
              value={responsavelSelecionado} 
              onValueChange={setResponsavelSelecionado}
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

          {/* Data da Falta */}
          <div className="space-y-2">
            <Label>Data da Falta</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataFalta && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataFalta ? 
                    format(dataFalta, "PPP", { locale: ptBR }) : 
                    "Selecione a data da falta"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataFalta}
                  onSelect={setDataFalta}
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  initialFocus
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto", isMobile && "text-sm")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Seleção da Data */}
          <div className="space-y-2">
            <Label>Data da Reposição *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataSelecionada && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataSelecionada ? 
                    format(dataSelecionada, "PPP", { locale: ptBR }) : 
                    "Selecione a data da reposição"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataSelecionada}
                  onSelect={setDataSelecionada}
                  disabled={(date) => !datasValidas.some(d => 
                    format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                  )}
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
                  className={cn("p-3 pointer-events-auto", isMobile && "text-sm")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre a reposição (opcional)"
              className="min-h-[60px]"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={criarReposicao.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={
                !alunoSelecionado || 
                !responsavelSelecionado || 
                !dataSelecionada || 
                criarReposicao.isPending
              }
            >
              {criarReposicao.isPending ? "Salvando..." : "Salvar Reposição"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReposicaoModal;