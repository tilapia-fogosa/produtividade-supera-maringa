import { useState, useMemo } from "react";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";
import { useCalendarioEventosUnificados, CalendarioEvento } from "@/hooks/use-calendario-eventos-unificados";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Plus, Trash2, Edit, Clock } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ReservarSalaModal } from "@/components/turmas/ReservarSalaModal";
import { EditarEventoSalaModal } from "@/components/turmas/EditarEventoSalaModal";
import { useExcluirEventoSala } from "@/hooks/use-excluir-evento-sala";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Função auxiliar para calcular as datas da semana (segunda a sábado)
const calcularDatasSemanais = (dataReferencia: Date): Date[] => {
  const inicioSemana = startOfWeek(dataReferencia, { weekStartsOn: 1 });
  return Array.from({ length: 6 }, (_, i) => addDays(inicioSemana, i));
};

const DIAS_SEMANA = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'] as const;
const HORARIOS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

// Converter horário para slot do grid
const horarioParaSlot = (horario: string): number => {
  const [hora] = horario.split(':').map(Number);
  return hora - 8 + 1; // +1 para o header
};

// Clarear cor hex
const clarearCor = (hex: string, percent: number = 30): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 255) + Math.floor((255 - ((num >> 16) & 255)) * (percent / 100)));
  const g = Math.min(255, ((num >> 8) & 255) + Math.floor((255 - ((num >> 8) & 255)) * (percent / 100)));
  const b = Math.min(255, (num & 255) + Math.floor((255 - (num & 255)) * (percent / 100)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

// Componente para renderizar um bloco de reserva no calendário
const BlocoReserva = ({ 
  evento, 
  onEdit, 
  onDelete 
}: { 
  evento: CalendarioEvento;
  onEdit: (evento: CalendarioEvento) => void;
  onDelete: (evento: CalendarioEvento) => void;
}) => {
  return (
    <div
      className="relative p-2 rounded border-l-4 h-full group hover:shadow-md transition-shadow"
      style={{
        backgroundColor: clarearCor(evento.sala_cor, 80),
        borderLeftColor: evento.sala_cor,
      }}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: evento.sala_cor }}>
            {evento.titulo}
          </p>
          <p className="text-xs text-muted-foreground truncate">{evento.sala_nome}</p>
          {evento.descricao && (
            <p className="text-xs text-muted-foreground truncate mt-1">{evento.descricao}</p>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onEdit(evento)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={() => onDelete(evento)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Componente para bloco de aula (bloqueado para reserva)
const BlocoAulaBloqueada = ({ evento }: { evento: CalendarioEvento }) => {
  return (
    <div
      className="relative p-2 rounded border h-full opacity-60"
      style={{
        backgroundColor: '#f5f5f5',
        borderColor: '#d0d0d0',
      }}
    >
      <div className="flex items-start gap-1">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-xs truncate text-muted-foreground">
            🔒 {evento.titulo}
          </p>
          <p className="text-xs text-muted-foreground truncate">{evento.sala_nome}</p>
        </div>
      </div>
    </div>
  );
};

export default function ReservasSala() {
  const { activeUnit } = useActiveUnit();
  const [semanaAtual, setSemanaAtual] = useState(new Date());
  const [modalNovaReserva, setModalNovaReserva] = useState(false);
  const [eventoParaEditar, setEventoParaEditar] = useState<CalendarioEvento | null>(null);
  const [eventoParaExcluir, setEventoParaExcluir] = useState<CalendarioEvento | null>(null);

  const datasSemanais = calcularDatasSemanais(semanaAtual);
  const dataInicio = datasSemanais[0];
  const dataFim = datasSemanais[datasSemanais.length - 1];

  const { data: eventosUnificados, isLoading } = useCalendarioEventosUnificados(
    dataInicio,
    dataFim,
    activeUnit?.id
  );

  const { mutate: excluirEvento } = useExcluirEventoSala();

  // Separar reservas de sala e aulas
  const { reservasSala, aulasBloqueadas } = useMemo(() => {
    if (!eventosUnificados) return { reservasSala: {}, aulasBloqueadas: {} };

    const reservas: Record<string, CalendarioEvento[]> = {};
    const aulas: Record<string, CalendarioEvento[]> = {};

    Object.entries(eventosUnificados).forEach(([dia, eventos]) => {
      reservas[dia] = eventos.filter(e => e.tipo_evento === 'evento_sala');
      aulas[dia] = eventos.filter(e => e.tipo_evento === 'turma');
    });

    return { reservasSala: reservas, aulasBloqueadas: aulas };
  }, [eventosUnificados]);

  // Organizar eventos em grid
  const eventosGrid = useMemo(() => {
    const grid: Record<string, Record<number, CalendarioEvento[]>> = {};

    // Inicializar grid
    DIAS_SEMANA.forEach(dia => {
      grid[dia] = {};
      HORARIOS.forEach(horario => {
        const slot = horarioParaSlot(horario);
        grid[dia][slot] = [];
      });
    });

    // Adicionar reservas e aulas ao grid
    [...Object.values(reservasSala).flat(), ...Object.values(aulasBloqueadas).flat()].forEach(evento => {
      const slot = horarioParaSlot(evento.horario_inicio);
      if (grid[evento.dia_semana]?.[slot]) {
        grid[evento.dia_semana][slot].push(evento);
      }
    });

    return grid;
  }, [reservasSala, aulasBloqueadas]);

  // Lista de reservas futuras
  const reservasFuturas = useMemo(() => {
    return Object.values(reservasSala)
      .flat()
      .sort((a, b) => {
        if (a.data_especifica && b.data_especifica) {
          return new Date(a.data_especifica).getTime() - new Date(b.data_especifica).getTime();
        }
        return 0;
      });
  }, [reservasSala]);

  const handleSemanaAnterior = () => {
    setSemanaAtual(prev => addDays(prev, -7));
  };

  const handleProximaSemana = () => {
    setSemanaAtual(prev => addDays(prev, 7));
  };

  const handleExcluirEvento = () => {
    if (eventoParaExcluir) {
      excluirEvento(eventoParaExcluir.evento_id, {
        onSuccess: () => {
          setEventoParaExcluir(null);
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reservas de Sala</h1>
          <p className="text-muted-foreground">Gerencie bloqueios e reservas de salas</p>
        </div>
        <Button onClick={() => setModalNovaReserva(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Reserva
        </Button>
      </div>

      {/* Navegação de Semana */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleSemanaAnterior}>
              ← Semana Anterior
            </Button>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {format(dataInicio, "dd/MM", { locale: ptBR })} - {format(dataFim, "dd/MM/yyyy", { locale: ptBR })}
            </CardTitle>
            <Button variant="outline" onClick={handleProximaSemana}>
              Próxima Semana →
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Grid do Calendário */}
          <div className="grid grid-cols-[80px_repeat(6,1fr)] gap-2">
            {/* Header com dias da semana */}
            <div className="font-semibold text-center">Horário</div>
            {datasSemanais.map((data, idx) => (
              <div key={idx} className="font-semibold text-center">
                <div>{format(data, "EEE", { locale: ptBR })}</div>
                <div className="text-sm text-muted-foreground">{format(data, "dd/MM")}</div>
              </div>
            ))}

            {/* Linhas de horários */}
            {HORARIOS.map((horario, horarioIdx) => (
              <>
                <div key={`hora-${horarioIdx}`} className="text-sm text-muted-foreground text-center py-2 border-t">
                  {horario}
                </div>
                {DIAS_SEMANA.map((dia, diaIdx) => {
                  const slot = horarioParaSlot(horario);
                  const eventosNaCell = eventosGrid[dia]?.[slot] || [];
                  const reservas = eventosNaCell.filter(e => e.tipo_evento === 'evento_sala');
                  const aulas = eventosNaCell.filter(e => e.tipo_evento === 'turma');

                  return (
                    <div
                      key={`${dia}-${horarioIdx}`}
                      className="border rounded p-1 min-h-[60px] bg-background hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        {/* Mostrar aulas bloqueadas primeiro */}
                        {aulas.map((evento, idx) => (
                          <BlocoAulaBloqueada key={`aula-${idx}`} evento={evento} />
                        ))}
                        {/* Mostrar reservas */}
                        {reservas.map((evento, idx) => (
                          <BlocoReserva
                            key={`reserva-${idx}`}
                            evento={evento}
                            onEdit={setEventoParaEditar}
                            onDelete={setEventoParaExcluir}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Reservas Futuras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Próximas Reservas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reservasFuturas.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma reserva futura</p>
          ) : (
            <div className="space-y-2">
              {reservasFuturas.map((reserva) => (
                <div
                  key={reserva.evento_id}
                  className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: reserva.sala_cor }}
                      />
                      <span className="font-semibold">{reserva.titulo}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {reserva.sala_nome} • {reserva.data_especifica && format(new Date(reserva.data_especifica), "dd/MM/yyyy", { locale: ptBR })} • {reserva.horario_inicio} - {reserva.horario_fim}
                    </p>
                    {reserva.descricao && (
                      <p className="text-sm text-muted-foreground mt-1">{reserva.descricao}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEventoParaEditar(reserva)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEventoParaExcluir(reserva)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Nova Reserva */}
      <ReservarSalaModal
        isOpen={modalNovaReserva}
        onClose={() => setModalNovaReserva(false)}
        unitId={activeUnit?.id}
      />

      {/* Modal Editar Reserva */}
      {eventoParaEditar && (
        <EditarEventoSalaModal
          open={!!eventoParaEditar}
          onOpenChange={(open) => !open && setEventoParaEditar(null)}
          eventoId={eventoParaEditar.evento_id}
        />
      )}

      {/* Dialog Confirmar Exclusão */}
      <AlertDialog open={!!eventoParaExcluir} onOpenChange={(open) => !open && setEventoParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a reserva "{eventoParaExcluir?.titulo}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluirEvento} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
