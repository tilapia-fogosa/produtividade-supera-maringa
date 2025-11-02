import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, ChevronLeft, ChevronRight, Clock, Plus, Settings, Pencil, Trash2 } from "lucide-react";
import { useAgendaProfessores, AgendaProfessor } from "@/hooks/use-agenda-professores";
import { useProfessores } from "@/hooks/use-professores";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";
import { Skeleton } from "@/components/ui/skeleton";
import { BloquearHorarioProfessorModal } from "@/components/professores/BloquearHorarioProfessorModal";
import { GerenciarPrioridadeModal } from "@/components/professores/GerenciarPrioridadeModal";
import { EditarEventoProfessorModal } from "@/components/professores/EditarEventoProfessorModal";
import { useExcluirEventoProfessor } from "@/hooks/use-excluir-evento-professor";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const diasSemana = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
const diasSemanaNomes: Record<string, string> = {
  segunda: "Segunda",
  terca: "Terça",
  quarta: "Quarta",
  quinta: "Quinta",
  sexta: "Sexta",
  sabado: "Sábado"
};

// Calcular datas da semana (segunda a sábado)
const calcularDatasSemanais = (dataReferencia: Date): Date[] => {
  const diaSemana = dataReferencia.getDay();
  const diasParaVoltar = diaSemana === 0 ? 6 : diaSemana - 1;
  
  const segunda = new Date(dataReferencia);
  segunda.setDate(dataReferencia.getDate() - diasParaVoltar);
  
  const datasSemanais = [];
  for (let i = 0; i < 6; i++) {
    const data = new Date(segunda);
    data.setDate(segunda.getDate() + i);
    datasSemanais.push(data);
  }
  
  return datasSemanais;
};

// Gerar slots de horário (8h às 21h)
const gerarSlots = () => {
  const slots: string[] = [];
  for (let hora = 8; hora <= 21; hora++) {
    slots.push(`${String(hora).padStart(2, '0')}:00`);
    if (hora < 21) {
      slots.push(`${String(hora).padStart(2, '0')}:30`);
    }
  }
  return slots;
};

const horarioParaSlot = (horario: string) => {
  const [hora, minuto] = horario.split(":").map(Number);
  const horaRelativa = hora - 8;
  return (horaRelativa * 2) + (minuto >= 30 ? 1 : 0);
};

// Calcular quantos slots um evento ocupa
const calcularDuracaoSlots = (horarioInicio: string, horarioFim: string): number => {
  const slotInicio = horarioParaSlot(horarioInicio);
  const slotFim = horarioParaSlot(horarioFim);
  return slotFim - slotInicio;
};

// Cores por professor (até 10 professores)
const coresProfessores = [
  { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
  { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600' },
  { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-600' },
  { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600' },
  { bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-600' },
  { bg: 'bg-cyan-500', text: 'text-white', border: 'border-cyan-600' },
  { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600' },
  { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-600' },
  { bg: 'bg-teal-500', text: 'text-white', border: 'border-teal-600' },
  { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600' },
];

// Bloco de evento na agenda
const BlocoEvento = ({ 
  evento, 
  cor, 
  duracaoSlots,
  larguraPercent = 100,
  onEditar,
  onExcluir
}: { 
  evento: AgendaProfessor; 
  cor: { bg: string; text: string; border: string };
  duracaoSlots: number;
  larguraPercent?: number;
  onEditar?: () => void;
  onExcluir?: () => void;
}) => {
  const alturaSlot = 80;
  const alturaTotal = duracaoSlots * alturaSlot - 4;
  const isEvento = evento.tipo === 'evento' && evento.evento_id;
  
  return (
    <div 
      className={`${cor.bg} ${cor.border} ${cor.text} border rounded p-2 text-sm overflow-hidden absolute top-0 left-0 group`}
      style={{ 
        height: `${alturaTotal}px`,
        width: `${larguraPercent}%`,
        zIndex: 10
      }}
    >
      <div className="font-semibold truncate">{evento.professor_nome}</div>
      <div className="truncate opacity-90">{evento.titulo}</div>
      <div className="flex items-center gap-1 opacity-75 text-xs mt-1">
        <Clock className="w-3 h-3" />
        <span>{evento.horario_inicio}-{evento.horario_fim}</span>
      </div>
      {evento.sala && (
        <div className="text-xs opacity-75 truncate mt-0.5">Sala: {evento.sala}</div>
      )}
      
      {/* Botões de ação - apenas para eventos (não aulas) */}
      {isEvento && (
        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 bg-white/90 hover:bg-white text-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              onEditar?.();
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 bg-white/90 hover:bg-white text-red-600 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              onExcluir?.();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default function AgendaProfessores() {
  const { activeUnit } = useActiveUnit();
  const { professores } = useProfessores();
  const [semanaAtual, setSemanaAtual] = useState(new Date());
  const [professoresAtivos, setProfessoresAtivos] = useState<Record<string, boolean>>({});
  const [modalBloqueio, setModalBloqueio] = useState(false);
  const [modalPrioridade, setModalPrioridade] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [eventoParaEditar, setEventoParaEditar] = useState<any>(null);
  const [eventoParaExcluir, setEventoParaExcluir] = useState<string | null>(null);
  
  const excluirEvento = useExcluirEventoProfessor();

  const datasSemanais = useMemo(() => calcularDatasSemanais(semanaAtual), [semanaAtual]);
  const dataInicio = datasSemanais[0];
  const dataFim = datasSemanais[5];

  const { data: agendaPorProfessor, isLoading } = useAgendaProfessores(
    dataInicio, 
    dataFim, 
    activeUnit?.id
  );

  const slots = useMemo(() => gerarSlots(), []);

  // Inicializar todos os professores como ativos por padrão
  useEffect(() => {
    if (professores.length > 0) {
      const inicial: Record<string, boolean> = {};
      professores.forEach(prof => {
        inicial[prof.id] = true;
      });
      setProfessoresAtivos(inicial);
    }
  }, [professores]);

  const proximaSemana = () => {
    const novaData = new Date(semanaAtual);
    novaData.setDate(novaData.getDate() + 7);
    setSemanaAtual(novaData);
  };

  const semanaAnterior = () => {
    const novaData = new Date(semanaAtual);
    novaData.setDate(novaData.getDate() - 7);
    setSemanaAtual(novaData);
  };

  const semanaAtualBtn = () => {
    setSemanaAtual(new Date());
  };

  const toggleProfessor = (professorId: string) => {
    setProfessoresAtivos(prev => ({
      ...prev,
      [professorId]: !prev[professorId]
    }));
  };
  
  const handleEditarEvento = (evento: AgendaProfessor) => {
    setEventoParaEditar({
      evento_id: evento.evento_id,
      tipo_evento: evento.tipo === 'evento' ? 'bloqueio' : evento.tipo,
      titulo: evento.titulo,
      horario_inicio: evento.horario_inicio,
      horario_fim: evento.horario_fim,
      data: evento.data,
      dia_semana: evento.dia_semana,
    });
    setModalEditar(true);
  };
  
  const handleConfirmarExclusao = async () => {
    if (!eventoParaExcluir) return;
    
    try {
      await excluirEvento.mutateAsync(eventoParaExcluir);
      setEventoParaExcluir(null);
    } catch (error) {
      console.error("Erro ao excluir evento:", error);
    }
  };

  // Criar mapeamento de cores por professor ID
  const coresPorProfessor = useMemo(() => {
    const mapa: Record<string, { bg: string; text: string; border: string }> = {};
    professores.forEach((prof, idx) => {
      mapa[prof.id] = coresProfessores[idx % coresProfessores.length];
    });
    return mapa;
  }, [professores]);

  // Filtrar professores ativos
  const professoresFiltrados = professores.filter(p => professoresAtivos[p.id]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Header com Navegação */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <h1 className="text-xl font-bold">Agenda de Professores</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setModalPrioridade(true)} size="sm" variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Prioridade
            </Button>
            <Button onClick={() => setModalBloqueio(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Bloquear Horário
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={semanaAnterior}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="text-center">
            <div className="font-medium">
              {format(dataInicio, "dd/MM", { locale: pt })} - {format(dataFim, "dd/MM/yyyy", { locale: pt })}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={semanaAtualBtn}>
              Hoje
            </Button>
            <Button variant="outline" size="sm" onClick={proximaSemana}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Filtros de Professores */}
      <Card className="p-4">
        <Label className="text-sm font-medium mb-3 block">Filtrar Professores</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {professores.map(prof => (
            <div key={prof.id} className="flex items-center gap-2">
              <Switch
                id={`prof-${prof.id}`}
                checked={professoresAtivos[prof.id] || false}
                onCheckedChange={() => toggleProfessor(prof.id)}
              />
              <Label htmlFor={`prof-${prof.id}`} className="text-sm cursor-pointer">
                {prof.nome}
              </Label>
            </div>
          ))}
        </div>
      </Card>

      {/* Grid de Agenda Unificada */}
      <Card className="p-4 overflow-x-auto">
        <div className="min-w-[1000px]">
          {/* Legenda de Cores */}
          <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b">
            {professoresFiltrados.map((prof) => {
              const cor = coresPorProfessor[prof.id];
              return (
                <div key={prof.id} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${cor.bg} ${cor.border} border`} />
                  <span className="text-sm font-medium">{prof.nome}</span>
                </div>
              );
            })}
          </div>

          {/* Header dos dias */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            <div className="font-medium text-sm sticky left-0 bg-background">Horário</div>
            {diasSemana.map((dia, idx) => (
              <div key={dia} className="font-medium text-sm text-center">
                <div>{diasSemanaNomes[dia]}</div>
                <div className="text-xs text-muted-foreground">
                  {format(datasSemanais[idx], "dd/MM")}
                </div>
              </div>
            ))}
          </div>

          {/* Grade Unificada de Horários */}
          <div className="space-y-0 border-t">
            {slots.map((slot, slotIdx) => {
              // Mapear slots ocupados por eventos que começaram antes
              const slotsOcupadosPorDia: Record<string, boolean> = {};
              
              diasSemana.forEach(dia => {
                professoresFiltrados.forEach(professor => {
                  const agenda = agendaPorProfessor?.[professor.id];
                  if (!agenda) return;
                  
                  agenda.eventos.forEach(evento => {
                    if (evento.dia_semana !== dia) return;
                    
                    const slotInicio = horarioParaSlot(evento.horario_inicio);
                    const slotFim = horarioParaSlot(evento.horario_fim);
                    
                    // Se este slot está ocupado por um evento que começou antes
                    if (slotIdx > slotInicio && slotIdx < slotFim) {
                      slotsOcupadosPorDia[dia] = true;
                    }
                  });
                });
              });

              return (
                <div key={slot} className="grid grid-cols-7 gap-2 border-b min-h-[80px]">
                  {/* Coluna de horário */}
                  <div className="text-xs font-medium text-muted-foreground flex items-start pt-2 sticky left-0 bg-background border-r">
                    {slot}
                  </div>
                  
                  {/* Colunas dos dias */}
                  {diasSemana.map((dia) => {
                    // Se este slot está ocupado por evento anterior, renderizar vazio
                    if (slotsOcupadosPorDia[dia]) {
                      return (
                        <div key={`${dia}-${slot}`} className="relative bg-muted/20" />
                      );
                    }

                    // Coletar eventos que COMEÇAM neste slot
                    const eventosIniciamAqui: Array<{
                      evento: AgendaProfessor;
                      cor: { bg: string; text: string; border: string };
                      duracao: number;
                    }> = [];
                    
                    professoresFiltrados.forEach((professor) => {
                      const agenda = agendaPorProfessor?.[professor.id];
                      if (!agenda) return;
                      
                      const eventosNoDia = agenda.eventos.filter(e => {
                        if (e.dia_semana !== dia) return false;
                        const slotEvento = horarioParaSlot(e.horario_inicio);
                        return slotIdx === slotEvento;
                      });
                      
                      eventosNoDia.forEach(evento => {
                        const duracao = calcularDuracaoSlots(
                          evento.horario_inicio,
                          evento.horario_fim
                        );
                        eventosIniciamAqui.push({ 
                          evento, 
                          cor: coresPorProfessor[professor.id], 
                          duracao 
                        });
                      });
                    });

                    const numEventos = eventosIniciamAqui.length;
                    const larguraEvento = numEventos > 0 ? 100 / numEventos : 100;

                    return (
                      <div key={`${dia}-${slot}`} className="relative bg-muted/20 h-full">
                        {eventosIniciamAqui.map(({ evento, cor, duracao }, idx) => (
                          <div
                            key={`${evento.professor_id}-${evento.evento_id || evento.turma_id}-${slot}`}
                            className="absolute top-0 h-full"
                            style={{
                              left: `${idx * larguraEvento}%`,
                              width: `${larguraEvento}%`,
                            }}
                          >
                            <BlocoEvento 
                              evento={evento}
                              cor={cor}
                              duracaoSlots={duracao}
                              larguraPercent={100}
                              onEditar={() => handleEditarEvento(evento)}
                              onExcluir={() => setEventoParaExcluir(evento.evento_id!)}
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {professoresFiltrados.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Selecione ao menos um professor nos filtros acima
            </div>
          )}
        </div>
      </Card>

      <BloquearHorarioProfessorModal
        open={modalBloqueio}
        onOpenChange={setModalBloqueio}
      />
      
      <GerenciarPrioridadeModal
        open={modalPrioridade}
        onOpenChange={setModalPrioridade}
      />
      
      <EditarEventoProfessorModal
        open={modalEditar}
        onOpenChange={setModalEditar}
        evento={eventoParaEditar}
      />
      
      <AlertDialog open={!!eventoParaExcluir} onOpenChange={(open) => !open && setEventoParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este bloqueio? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmarExclusao} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
