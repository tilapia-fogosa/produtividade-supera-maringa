import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, CheckCircle2, User, DoorOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useHorariosDisponiveisSalas } from "@/hooks/use-horarios-disponiveis-salas";
import { useProfessoresDisponiveis } from "@/hooks/use-professores-disponiveis";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

interface AulaInauguralSelectorProps {
  dataAulaInaugural: Date | undefined;
  setDataAulaInaugural: (date: Date | undefined) => void;
  horarioSelecionado: string;
  setHorarioSelecionado: (horario: string) => void;
  professorSelecionado: { id: string; nome: string; prioridade: number } | null;
  setProfessorSelecionado: (professor: { id: string; nome: string; prioridade: number } | null) => void;
  salaSelecionada: { id: string; nome: string } | null;
  setSalaSelecionada: (sala: { id: string; nome: string } | null) => void;
}

export function AulaInauguralSelector({
  dataAulaInaugural,
  setDataAulaInaugural,
  horarioSelecionado,
  setHorarioSelecionado,
  professorSelecionado,
  setProfessorSelecionado,
  salaSelecionada,
  setSalaSelecionada,
}: AulaInauguralSelectorProps) {
  const [mostrarSeletorProfessor, setMostrarSeletorProfessor] = React.useState(false);
  const { activeUnit } = useActiveUnit();

  // Buscar horários disponíveis (salas livres)
  const { data: horariosDisponiveis = [], isLoading: loadingHorarios } = useHorariosDisponiveisSalas(
    dataAulaInaugural || null,
    activeUnit?.id
  );

  // Buscar professores disponíveis
  const { data: professoresDisponiveis = [], isLoading: loadingProfessores } = useProfessoresDisponiveis(
    dataAulaInaugural || null,
    horarioSelecionado || null,
    60, // Duração de 1 hora
    activeUnit?.id
  );

  // Quando selecionar um horário, auto-selecionar professor e sala
  React.useEffect(() => {
    if (horarioSelecionado && professoresDisponiveis.length > 0) {
      const primeiroProfessor = professoresDisponiveis[0];
      setProfessorSelecionado({
        id: primeiroProfessor.professor_id,
        nome: primeiroProfessor.professor_nome,
        prioridade: primeiroProfessor.prioridade,
      });
    } else {
      setProfessorSelecionado(null);
    }
  }, [horarioSelecionado, professoresDisponiveis, setProfessorSelecionado]);

  React.useEffect(() => {
    if (horarioSelecionado) {
      const horarioData = horariosDisponiveis.find(h => h.horario_inicio === horarioSelecionado);
      if (horarioData && horarioData.salas_livres_ids.length > 0) {
        // Por enquanto, só pegamos o primeiro ID - podemos melhorar depois
        setSalaSelecionada({
          id: horarioData.salas_livres_ids[0],
          nome: `Sala ${horarioData.salas_livres_ids.length} disponível(is)`,
        });
      } else {
        setSalaSelecionada(null);
      }
    }
  }, [horarioSelecionado, horariosDisponiveis, setSalaSelecionada]);

  // Resetar horário quando mudar a data
  const handleDateChange = (date: Date | undefined) => {
    setDataAulaInaugural(date);
    setHorarioSelecionado("");
    setProfessorSelecionado(null);
    setSalaSelecionada(null);
    setMostrarSeletorProfessor(false);
  };

  const temDisponibilidade = professorSelecionado && salaSelecionada;

  return (
    <div className="space-y-3">
      {/* Seleção de Data */}
      <div className="space-y-1.5">
        <Label className="text-xs">Data da Aula Inaugural</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full h-9 justify-start text-left font-normal",
                !dataAulaInaugural && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dataAulaInaugural
                ? format(dataAulaInaugural, "dd/MM/yyyy", { locale: ptBR })
                : "Selecione uma data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[9999]" align="start">
            <Calendar
              mode="single"
              selected={dataAulaInaugural}
              onSelect={handleDateChange}
              locale={ptBR}
              initialFocus
              className="pointer-events-auto"
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Seleção de Horário (aparece após selecionar data) */}
      {dataAulaInaugural && (
        <div className="space-y-1.5">
          <Label className="text-xs">Horário</Label>
          <Select value={horarioSelecionado} onValueChange={setHorarioSelecionado}>
            <SelectTrigger className="h-9">
              <SelectValue 
                placeholder={loadingHorarios ? "Carregando horários..." : "Selecione um horário"} 
              />
            </SelectTrigger>
            <SelectContent className="z-[9999]">
              {horariosDisponiveis.length === 0 && !loadingHorarios ? (
                <SelectItem value="_empty" disabled>
                  Nenhum horário disponível
                </SelectItem>
              ) : (
                horariosDisponiveis.map((horario) => (
                  <SelectItem key={horario.horario_inicio} value={horario.horario_inicio}>
                    {horario.horario_inicio.slice(0, 5)} - {horario.horario_fim.slice(0, 5)} 
                    ({horario.total_salas_livres} sala{horario.total_salas_livres > 1 ? 's' : ''})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Resultado da disponibilidade */}
      {horarioSelecionado && (
        <div className="mt-3 p-3 rounded-lg border bg-muted/50">
          {loadingProfessores ? (
            <div className="text-sm text-muted-foreground">Verificando disponibilidade...</div>
          ) : temDisponibilidade ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-700">Disponibilidade confirmada</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>Professor:</strong> {professorSelecionado.nome}
                  <span className="text-xs text-muted-foreground ml-1">
                    (prioridade {professorSelecionado.prioridade})
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <DoorOpen className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>Sala:</strong> {salaSelecionada.nome}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>Data:</strong> {format(dataAulaInaugural!, "dd/MM/yyyy", { locale: ptBR })} às {horarioSelecionado.slice(0, 5)}
                </span>
              </div>

              {/* Botão para alterar professor */}
              {!mostrarSeletorProfessor ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1 w-full"
                  onClick={() => setMostrarSeletorProfessor(true)}
                >
                  Alterar Professor
                </Button>
              ) : (
                <div className="mt-1 space-y-1.5">
                  <Label className="text-xs">Selecionar outro professor</Label>
                  <Select
                    value={professorSelecionado.id}
                    onValueChange={(value) => {
                      const prof = professoresDisponiveis.find(p => p.professor_id === value);
                      if (prof) {
                        setProfessorSelecionado({
                          id: prof.professor_id,
                          nome: prof.professor_nome,
                          prioridade: prof.prioridade,
                        });
                      }
                      setMostrarSeletorProfessor(false);
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione um professor" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]">
                      {professoresDisponiveis.map((prof) => (
                        <SelectItem key={prof.professor_id} value={prof.professor_id}>
                          {prof.professor_nome} (prioridade {prof.prioridade})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <AlertCircle className="h-4 w-4" />
              <span>Nenhum professor disponível neste horário</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
