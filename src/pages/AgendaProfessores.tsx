import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react";
import { useAgendaProfessores, AgendaProfessor } from "@/hooks/use-agenda-professores";
import { useProfessores } from "@/hooks/use-professores";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";
import { Skeleton } from "@/components/ui/skeleton";
import { BloquearHorarioProfessorModal } from "@/components/professores/BloquearHorarioProfessorModal";
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

// Gerar slots de horário (6h às 21h)
const gerarSlots = () => {
  const slots: string[] = [];
  for (let hora = 6; hora <= 21; hora++) {
    slots.push(`${String(hora).padStart(2, '0')}:00`);
    if (hora < 21) {
      slots.push(`${String(hora).padStart(2, '0')}:30`);
    }
  }
  return slots;
};

const horarioParaSlot = (horario: string) => {
  const [hora, minuto] = horario.split(":").map(Number);
  const horaRelativa = hora - 6;
  return (horaRelativa * 2) + (minuto >= 30 ? 1 : 0);
};

// Bloco de evento na agenda
const BlocoEvento = ({ evento }: { evento: AgendaProfessor }) => {
  const isAula = evento.tipo === 'aula';
  const bgColor = isAula ? 'bg-blue-100 border-blue-300' : 'bg-orange-100 border-orange-300';
  const textColor = isAula ? 'text-blue-900' : 'text-orange-900';
  
  return (
    <div className={`${bgColor} border rounded-md p-2 text-xs ${textColor} min-h-[60px]`}>
      <div className="font-medium mb-1">{evento.titulo}</div>
      <div className="flex items-center gap-1 text-[10px] opacity-75">
        <Clock className="w-3 h-3" />
        <span>{evento.horario_inicio} - {evento.horario_fim}</span>
      </div>
      {evento.sala && (
        <div className="text-[10px] opacity-75 mt-1">Sala: {evento.sala}</div>
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
  useMemo(() => {
    const inicial: Record<string, boolean> = {};
    professores.forEach(prof => {
      inicial[prof.id] = true;
    });
    setProfessoresAtivos(inicial);
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
          <Button onClick={() => setModalBloqueio(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Bloquear Horário
          </Button>
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

      {/* Grid de Agenda */}
      <Card className="p-4 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header dos dias */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            <div className="font-medium text-sm">Horário</div>
            {diasSemana.map((dia, idx) => (
              <div key={dia} className="font-medium text-sm text-center">
                <div>{diasSemanaNomes[dia]}</div>
                <div className="text-xs text-muted-foreground">
                  {format(datasSemanais[idx], "dd/MM")}
                </div>
              </div>
            ))}
          </div>

          {/* Grid para cada professor */}
          {professoresFiltrados.map(professor => {
            const agenda = agendaPorProfessor?.[professor.id];
            
            return (
              <div key={professor.id} className="mb-6 border-t pt-4">
                <h3 className="font-semibold text-sm mb-3">{professor.nome}</h3>
                
                {/* Grid de horários */}
                <div className="space-y-1">
                  {slots.map((slot, slotIdx) => (
                    <div key={slot} className="grid grid-cols-7 gap-2 min-h-[40px]">
                      {/* Coluna de horário */}
                      <div className="text-xs text-muted-foreground flex items-center">
                        {slot}
                      </div>
                      
                      {/* Colunas dos dias */}
                      {diasSemana.map((dia) => {
                        // Encontrar eventos neste slot e dia
                        const eventosNoDia = agenda?.eventos.filter(e => {
                          const mesmoDia = e.dia_semana === dia;
                          const slotEvento = horarioParaSlot(e.horario_inicio);
                          return mesmoDia && slotEvento === slotIdx;
                        }) || [];

                        return (
                          <div key={`${dia}-${slot}`} className="relative">
                            {eventosNoDia.map(evento => (
                              <BlocoEvento key={evento.evento_id || evento.turma_id} evento={evento} />
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

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
    </div>
  );
}
