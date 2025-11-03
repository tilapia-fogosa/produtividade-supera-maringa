import { useState, useMemo } from "react";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";
import { useCalendarioEventosUnificados, CalendarioEvento } from "@/hooks/use-calendario-eventos-unificados";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Trash2, Edit, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, startOfWeek } from "date-fns";
import { ReservarSalaModal } from "@/components/turmas/ReservarSalaModal";
import { EditarEventoSalaModal } from "@/components/turmas/EditarEventoSalaModal";
import { useExcluirEventoSala } from "@/hooks/use-excluir-evento-sala";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const diasSemana = {
  segunda: "SEG",
  terca: "TER",
  quarta: "QUA",
  quinta: "QUI",
  sexta: "SEX",
  sabado: "SAB"
};

// Função auxiliar para calcular as datas da semana (segunda a sábado)
const calcularDatasSemanais = (dataReferencia: Date): Date[] => {
  const inicioSemana = startOfWeek(dataReferencia, { weekStartsOn: 1 });
  return Array.from({ length: 6 }, (_, i) => addDays(inicioSemana, i));
};

// Converter horário para slot do grid (slots de 30 minutos, 6h às 21h)
const horarioParaSlot = (horario: string): number => {
  const [hora, minuto] = horario.split(':').map(Number);
  const horaInicial = 6;
  return ((hora - horaInicial) * 2) + (minuto >= 30 ? 1 : 0);
};

const obterDiaSemanaIndex = (diaSemana: string): number => {
  const dias: Record<string, number> = {
    'segunda': 0,
    'terca': 1,
    'quarta': 2,
    'quinta': 3,
    'sexta': 4,
    'sabado': 5,
  };
  return dias[diaSemana] ?? -1;
};

// Clarear cor hex
const clarearCor = (hex: string, percent: number = 30): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 255) + Math.floor((255 - ((num >> 16) & 255)) * (percent / 100)));
  const g = Math.min(255, ((num >> 8) & 255) + Math.floor((255 - ((num >> 8) & 255)) * (percent / 100)));
  const b = Math.min(255, (num & 255) + Math.floor((255 - (num & 255)) * (percent / 100)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

// Componente para bloco de reserva
const BlocoEvento = ({
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
      className="h-full p-2 rounded-sm border-l-4 flex flex-col justify-between group relative"
      style={{
        backgroundColor: clarearCor(evento.sala_cor, 80),
        borderLeftColor: evento.sala_cor,
      }}
    >
      <div className="flex-1 min-h-0">
        <p className="font-semibold text-xs truncate mb-0.5" style={{ color: evento.sala_cor }}>
          {evento.titulo}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">
          {evento.sala_nome}
        </p>
        {evento.descricao && (
          <p className="text-[10px] text-muted-foreground truncate mt-1">
            {evento.descricao}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">
          {evento.horario_inicio} - {evento.horario_fim}
        </p>
      </div>
      
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(evento);
          }}
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(evento);
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

// Componente para turma (bloqueada)
const BlocoTurmaBloqueada = ({ evento }: { evento: CalendarioEvento }) => {
  return (
    <div className="h-full p-2 rounded-sm bg-blue-50 border-l-4 border-blue-500">
      <p className="font-medium text-xs truncate text-blue-900">
        🔒 {evento.titulo}
      </p>
      <p className="text-[10px] text-blue-700 truncate">
        {evento.sala_nome}
      </p>
      <p className="text-[10px] text-blue-600 mt-1">
        {evento.horario_inicio} - {evento.horario_fim}
      </p>
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

  const { data: eventosPorDia, isLoading, error } = useCalendarioEventosUnificados(
    dataInicio,
    dataFim,
    activeUnit?.id
  );

  const { mutate: excluirEvento } = useExcluirEventoSala();

  // Filtrar eventos: mostrar reservas e turmas (turmas como bloqueadas)
  const eventosFiltradasPorDia = useMemo(() => {
    if (!eventosPorDia) return {};
    
    const resultado: Record<string, CalendarioEvento[]> = {};
    
    Object.entries(eventosPorDia).forEach(([dia, eventos]) => {
      // Excluir domingo
      if (dia === 'domingo') return;
      
      // Mostrar eventos de sala E turmas (turmas aparecem como bloqueadas)
      const eventosFiltrados = eventos.filter(evento => {
        return evento.tipo_evento === 'evento_sala' || evento.tipo_evento === 'turma';
      });
      
      resultado[dia] = eventosFiltrados;
    });
    
    return resultado;
  }, [eventosPorDia]);

  // Estrutura do grid - agrupar eventos sobrepostos temporalmente
  const eventosGrid = useMemo(() => {
    const grid: Record<string, CalendarioEvento[]> = {};
    
    Object.entries(eventosFiltradasPorDia).forEach(([diaSemana, eventos]) => {
      // Para cada evento, verificar se há outros que se sobrepõem
      eventos.forEach(evento => {
        const eventoInicio = horarioParaSlot(evento.horario_inicio);
        const eventoFim = horarioParaSlot(evento.horario_fim);
        
        // Encontrar todos os eventos que se sobrepõem temporalmente com este
        const eventosSobrepostos = eventos.filter(outro => {
          const outroInicio = horarioParaSlot(outro.horario_inicio);
          const outroFim = horarioParaSlot(outro.horario_fim);
          // Verificar se há sobreposição temporal
          return eventoInicio < outroFim && eventoFim > outroInicio;
        });
        
        // Usar o menor horário de início dos eventos sobrepostos como chave
        const menorInicio = Math.min(...eventosSobrepostos.map(e => horarioParaSlot(e.horario_inicio)));
        const chave = `${menorInicio}-${diaSemana}`;
        
        // Adicionar ao grid apenas se não estiver lá ainda
        if (!grid[chave]) {
          grid[chave] = eventosSobrepostos;
        }
      });
    });
    
    return grid;
  }, [eventosFiltradasPorDia]);

  const navegarSemana = (direcao: 'anterior' | 'proxima') => {
    const novaSemana = new Date(semanaAtual);
    if (direcao === 'anterior') {
      novaSemana.setDate(novaSemana.getDate() - 7);
    } else {
      novaSemana.setDate(novaSemana.getDate() + 7);
    }
    setSemanaAtual(novaSemana);
  };

  const voltarParaHoje = () => {
    setSemanaAtual(new Date());
  };

  const handleEditarEvento = (evento: CalendarioEvento) => {
    setEventoParaEditar(evento);
  };

  const handleExcluirEvento = (evento: CalendarioEvento) => {
    setEventoParaExcluir(evento);
  };

  const confirmarExclusao = () => {
    if (eventoParaExcluir && eventoParaExcluir.tipo_evento === 'evento_sala') {
      excluirEvento(eventoParaExcluir.evento_id, {
        onSuccess: () => {
          setEventoParaExcluir(null);
        },
        onError: (error) => {
          console.error('❌ Erro ao excluir evento:', error);
          alert('Erro ao excluir evento. Tente novamente.');
        }
      });
    }
  };

  // Slots de 30 minutos (6h às 21h = 30 slots)
  const slots = Array.from({ length: 30 }, (_, i) => {
    const horaInicial = 6;
    const hora = Math.floor(i / 2) + horaInicial;
    const minuto = (i % 2) * 30;
    return `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Reservas de Sala</h1>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Reservas de Sala</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Erro ao carregar reservas de sala.</p>
        </div>
      </div>
    );
  }

  const hoje = new Date();
  const mesAno = semanaAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header com navegação */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Reservas de Sala</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navegarSemana('anterior')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="text-lg font-medium capitalize">
            {mesAno}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navegarSemana('proxima')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={voltarParaHoje}
          >
            Hoje
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={() => setModalNovaReserva(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Reserva
          </Button>
        </div>
      </div>

      {/* Grid do Calendário */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Header dos dias (segunda a sábado) */}
        <div 
          className="bg-gray-50 sticky top-0 z-10"
          style={{
            display: 'grid',
            gridTemplateColumns: '45px repeat(6, 1fr)',
          }}
        >
          <div className="p-3 text-center border-r border-gray-200 text-sm font-medium">
          </div>
          {datasSemanais.map((data, index) => {
            const diaSemanaChave = Object.keys(diasSemana)[index];
            const isHoje = data.toDateString() === hoje.toDateString();
            
            return (
              <div key={index} className="p-3 text-center border-r border-gray-200 last:border-r-0">
                <div className="text-sm font-medium">{diasSemana[diaSemanaChave as keyof typeof diasSemana]}</div>
                <div className={`text-lg ${isHoje ? 'bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mt-1' : ''}`}>
                  {data.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Container do Grid Principal */}
        <div 
          className="relative"
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(${slots.length}, 50px)`,
            gridTemplateColumns: '45px repeat(6, 1fr)',
          }}
        >
          {/* Renderizar linhas de horário */}
          {slots.map((slot, slotIndex) => (
            <div
              key={`time-${slotIndex}`}
              className="border-r border-b border-gray-200 bg-gray-50 text-xs text-muted-foreground flex items-center justify-center"
              style={{
                gridRow: slotIndex + 1,
                gridColumn: 1,
              }}
            >
              {slot.endsWith(':00') ? slot : ''}
            </div>
          ))}

          {/* Renderizar células base do grid */}
          {slots.map((slot, slotIndex) => 
            datasSemanais.map((data, diaIndex) => (
              <div
                key={`cell-${slotIndex}-${diaIndex}`}
                className="border-r border-b border-gray-200 last:border-r-0"
                style={{
                  gridRow: slotIndex + 1,
                  gridColumn: diaIndex + 2,
                }}
              />
            ))
          )}

          {/* Renderizar eventos unificados (reservas + turmas bloqueadas) */}
          {(() => {
            return Object.entries(eventosGrid).map(([chave, eventos]) => {
              const [slotStr, diaSemana] = chave.split('-');
              const slot = parseInt(slotStr);
              const diaIndex = obterDiaSemanaIndex(diaSemana);
              
              if (diaIndex === -1 || eventos.length === 0) return null;
              
              // Calcular duração usando o maior horário de fim entre os eventos sobrepostos
              const maiorFim = Math.max(...eventos.map(e => horarioParaSlot(e.horario_fim)));
              const duracaoSlots = maiorFim - slot;
              
              const totalEventos = eventos.length;
              const isCompact = totalEventos > 1;
              
              return (
                <div
                  key={chave}
                  className="relative"
                  style={{
                    gridRow: `${slot + 1} / ${slot + 1 + duracaoSlots}`,
                    gridColumn: diaIndex + 2,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${totalEventos}, 1fr)`,
                    gap: totalEventos > 1 ? '2px' : undefined,
                    padding: '1px',
                    zIndex: 5,
                  }}
                >
                  {eventos.map((evento) => {
                    // Calcular posição vertical individual dentro do container
                    const eventoInicio = horarioParaSlot(evento.horario_inicio);
                    const eventoFim = horarioParaSlot(evento.horario_fim);
                    const offsetInicio = eventoInicio - slot;
                    const duracaoEvento = eventoFim - eventoInicio;
                    const alturaSlot = 50; // 50px por slot
                    
                    return (
                      <div 
                        key={`evento-${evento.evento_id}`} 
                        className="relative"
                        style={{
                          marginTop: `${offsetInicio * alturaSlot}px`,
                          height: `${duracaoEvento * alturaSlot - 2}px`,
                        }}
                      >
                        <div className="h-full border border-gray-300 bg-white rounded-sm overflow-hidden">
                          {evento.tipo_evento === 'evento_sala' ? (
                            <BlocoEvento 
                              evento={evento} 
                              onEdit={handleEditarEvento}
                              onDelete={handleExcluirEvento}
                            />
                          ) : (
                            <BlocoTurmaBloqueada evento={evento} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            });
          })()}
        </div>
      </div>

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

      {/* Dialog de confirmação para excluir evento */}
      <AlertDialog open={!!eventoParaExcluir} onOpenChange={(open) => !open && setEventoParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Reserva</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{eventoParaExcluir?.titulo}" da sala {eventoParaExcluir?.sala_nome}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao} className="bg-destructive">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
