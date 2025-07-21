
import { Calendar, Clock, Users, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCalendarioTurmas, CalendarioTurma } from "@/hooks/use-calendario-turmas";
import { Skeleton } from "@/components/ui/skeleton";

const diasSemana = {
  segunda: "Segunda",
  terca: "Terça", 
  quarta: "Quarta",
  quinta: "Quinta",
  sexta: "Sexta",
  sabado: "Sábado"
};

const TurmaCard = ({ turma }: { turma: CalendarioTurma }) => (
  <Card className="mb-1 hover:shadow-md transition-shadow w-full">
    <CardContent className="p-2 space-y-1">
      <div className="flex items-center gap-1 text-xs font-medium">
        <Clock className="w-3 h-3 text-primary flex-shrink-0" />
        <span className="truncate">{turma.horario_inicio}</span>
      </div>
      <div className="flex justify-center">
        <Badge variant="outline" className="text-xs px-1 py-0">
          {turma.categoria}
        </Badge>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <User className="w-3 h-3 flex-shrink-0" />
        <span className="truncate text-xs">{turma.professor_nome}</span>
      </div>
      <div className="flex items-center gap-1 text-xs">
        <Users className="w-3 h-3 text-primary flex-shrink-0" />
        <span className="font-medium">{turma.total_alunos_ativos}</span>
      </div>
    </CardContent>
  </Card>
);

const DiaContainer = ({ dia, turmas }: { dia: string; turmas: CalendarioTurma[] }) => (
  <div className="flex flex-col h-full">
    <div className="flex flex-col items-center gap-1 pb-2 border-b mb-2 sticky top-0 bg-background">
      <h3 className="text-sm font-semibold text-center">{diasSemana[dia as keyof typeof diasSemana]}</h3>
      <Badge variant="secondary" className="text-xs">
        {turmas.length}
      </Badge>
    </div>
    <div className="space-y-1 flex-1 overflow-y-auto">
      {turmas.map((turma) => (
        <TurmaCard key={turma.turma_id} turma={turma} />
      ))}
    </div>
  </div>
);

export default function CalendarioAulas() {
  const { data: turmasPorDia, isLoading, error } = useCalendarioTurmas();

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Calendário de Aulas</h1>
        </div>
        <div className="grid grid-cols-6 gap-2 h-96">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Calendário de Aulas</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Erro ao carregar o calendário de aulas.</p>
        </div>
      </div>
    );
  }

  const diasOrdenados = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Calendário de Aulas</h1>
      </div>

      <div className="grid grid-cols-6 gap-2 h-[calc(100vh-200px)] overflow-hidden">
        {diasOrdenados.map((dia) => (
          <div key={dia} className="border-r last:border-r-0 pr-2 last:pr-0">
            <DiaContainer
              dia={dia}
              turmas={turmasPorDia?.[dia] || []}
            />
          </div>
        ))}
      </div>

      {diasOrdenados.every(dia => !turmasPorDia?.[dia]?.length) && (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma turma encontrada.</p>
        </div>
      )}
    </div>
  );
}
