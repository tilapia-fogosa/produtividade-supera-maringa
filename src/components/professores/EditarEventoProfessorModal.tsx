import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEditarEventoProfessor } from "@/hooks/use-editar-evento-professor";
import { TIPOS_EVENTO, OPCOES_DURACAO, obterHorarioFuncionamento, calcularHorarioFim, horarioEstaNoFuncionamento } from "@/constants/horariosFuncionamento";

interface EventoParaEditar {
  evento_id: string;
  tipo_evento: string;
  titulo: string;
  descricao?: string;
  horario_inicio: string;
  horario_fim: string;
  data?: string;
  dia_semana?: string;
}

interface EditarEventoProfessorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evento: EventoParaEditar | null;
}

export function EditarEventoProfessorModal({ open, onOpenChange, evento }: EditarEventoProfessorModalProps) {
  const editarEvento = useEditarEventoProfessor();

  const [tipoEvento, setTipoEvento] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("");
  const [duracao, setDuracao] = useState(60);

  // Preencher form quando evento mudar
  useEffect(() => {
    if (evento && open) {
      setTipoEvento(evento.tipo_evento || "");
      setTitulo(evento.titulo || "");
      setDescricao(evento.descricao || "");
      setHorarioInicio(evento.horario_inicio || "");
      
      // Calcular duração atual
      if (evento.horario_inicio && evento.horario_fim) {
        const [horaIni, minIni] = evento.horario_inicio.split(':').map(Number);
        const [horaFim, minFim] = evento.horario_fim.split(':').map(Number);
        const duracaoCalc = (horaFim * 60 + minFim) - (horaIni * 60 + minIni);
        setDuracao(duracaoCalc);
      }
    }
  }, [evento, open]);

  const resetForm = () => {
    setTipoEvento("");
    setTitulo("");
    setDescricao("");
    setHorarioInicio("");
    setDuracao(60);
  };

  const handleSalvar = async () => {
    if (!evento) return;

    try {
      await editarEvento.mutateAsync({
        eventoId: evento.evento_id,
        tipoEvento,
        titulo,
        descricao,
        horarioInicio,
        duracaoMinutos: duracao,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao editar evento:", error);
    }
  };

  // Gerar horários disponíveis (8h às 21h, intervalos de 30min)
  const gerarHorariosDisponiveis = () => {
    const horarios: string[] = [];
    for (let hora = 8; hora <= 21; hora++) {
      horarios.push(`${String(hora).padStart(2, '0')}:00`);
      if (hora < 21) {
        horarios.push(`${String(hora).padStart(2, '0')}:30`);
      }
    }
    return horarios;
  };

  const horariosDisponiveis = gerarHorariosDisponiveis();

  // Filtrar durações válidas
  const duracoesFiltradas = OPCOES_DURACAO.filter(opcao => {
    if (!horarioInicio) return true;
    
    const horarioFim = calcularHorarioFim(horarioInicio, opcao.valor);
    const dataRef = new Date();
    const horarioFuncionamento = obterHorarioFuncionamento(dataRef);
    
    return horarioEstaNoFuncionamento(horarioInicio, horarioFim, horarioFuncionamento);
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Evento</DialogTitle>
          <DialogDescription>
            Atualize as informações do evento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Tipo de Evento</Label>
            <Select value={tipoEvento} onValueChange={setTipoEvento}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_EVENTO.map((tipo) => (
                  <SelectItem key={tipo.valor} value={tipo.valor}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Título</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Reunião pedagógica"
            />
          </div>

          <div>
            <Label>Descrição (opcional)</Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhes adicionais..."
              rows={3}
            />
          </div>

          <div>
            <Label>Horário de Início</Label>
            <Select value={horarioInicio} onValueChange={setHorarioInicio}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o horário" />
              </SelectTrigger>
              <SelectContent>
                {horariosDisponiveis.map((horario) => (
                  <SelectItem key={horario} value={horario}>
                    {horario}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Duração</Label>
            <Select value={String(duracao)} onValueChange={(v) => setDuracao(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a duração" />
              </SelectTrigger>
              <SelectContent>
                {duracoesFiltradas.map((opcao) => (
                  <SelectItem key={opcao.valor} value={String(opcao.valor)}>
                    {opcao.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {horarioInicio && (
              <p className="text-sm text-muted-foreground mt-1">
                Horário: {horarioInicio} - {calcularHorarioFim(horarioInicio, duracao)}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSalvar} 
              disabled={!tipoEvento || !titulo || !horarioInicio || editarEvento.isPending}
            >
              {editarEvento.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
