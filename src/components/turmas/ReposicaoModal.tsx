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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  const [tipoResponsavel, setTipoResponsavel] = useState<'professor' | 'funcionario'>('professor');
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>();
  const [observacoes, setObservacoes] = useState<string>("");

  // Calcular datas válidas baseadas no dia da semana da turma
  const datasValidas = calcularDatasValidas(turma.dia_semana);
  
  const handleSubmit = async () => {
    if (!alunoSelecionado || !responsavelSelecionado || !dataSelecionada) {
      return;
    }

    try {
      await criarReposicao.mutateAsync({
        aluno_id: alunoSelecionado,
        turma_id: turma.id,
        data_reposicao: format(dataSelecionada, 'yyyy-MM-dd'),
        responsavel_id: responsavelSelecionado,
        responsavel_tipo: tipoResponsavel,
        observacoes: observacoes || undefined,
        unit_id: turma.unit_id,
        created_by: 'sistema', // Por enquanto fixo, pois não há login
      });

      // Resetar form
      setAlunoSelecionado("");
      setResponsavelSelecionado("");
      setTipoResponsavel('professor');
      setDataSelecionada(undefined);
      setObservacoes("");
      onClose();
    } catch (error) {
      console.error('Erro ao salvar reposição:', error);
    }
  };

  const responsaveisFiltrados = responsaveis.filter(r => r.tipo === tipoResponsavel);

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

          {/* Tipo de Responsável */}
          <div className="space-y-2">
            <Label htmlFor="tipo-responsavel">Tipo de Responsável *</Label>
            <Select value={tipoResponsavel} onValueChange={(value: 'professor' | 'funcionario') => {
              setTipoResponsavel(value);
              setResponsavelSelecionado(""); // Reset responsável quando mudar tipo
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professor">Professor</SelectItem>
                <SelectItem value="funcionario">Funcionário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seleção do Responsável */}
          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável *</Label>
            <Select 
              value={responsavelSelecionado} 
              onValueChange={setResponsavelSelecionado}
              disabled={!tipoResponsavel}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {responsaveisFiltrados.map((responsavel) => (
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
            <div className="text-sm text-muted-foreground mb-2">
              Datas disponíveis para {turma.dia_semana}:
            </div>
            <Calendar
              mode="single"
              selected={dataSelecionada}
              onSelect={setDataSelecionada}
              disabled={(date) => !datasValidas.some(d => 
                format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
              )}
              modifiers={{
                available: datasValidas
              }}
              modifiersStyles={{
                available: { 
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))'
                }
              }}
              locale={ptBR}
              className={cn("rounded-md border pointer-events-auto", isMobile && "text-sm")}
            />
            {dataSelecionada && (
              <div className="text-sm text-primary font-medium">
                Data selecionada: {format(dataSelecionada, 'dd/MM/yyyy', { locale: ptBR })}
              </div>
            )}
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