import { Calendar, Clock, Users, MapPin, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCalendarioTurmas, CalendarioTurma } from "@/hooks/use-calendario-turmas";
import { Skeleton } from "@/components/ui/skeleton";

const diasSemana = {
  segunda: "Segunda-feira",
  terca: "Terça-feira", 
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sábado"
};

const TurmaCard = ({ turma }: { turma: CalendarioTurma }) => (
  <Card className="mb-3 hover:shadow-md transition-shadow">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium truncate">
          {turma.nome_completo}
        </CardTitle>
        <Badge variant="outline" className="text-xs">
          {turma.categoria}
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="pt-0 space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>{turma.horario_inicio}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="w-4 h-4" />
        <span>{turma.sala}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <User className="w-4 h-4" />
        <span className="truncate">{turma.professor_nome}</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Users className="w-4 h-4 text-primary" />
        <span className="font-medium">{turma.total_alunos_ativos} alunos</span>
      </div>
    </CardContent>
  </Card>
);

const DiaContainer = ({ dia, turmas }: { dia: string; turmas: CalendarioTurma[] }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 pb-2 border-b">
      <Calendar className="w-5 h-5 text-primary" />
      <h3 className="text-lg font-semibold">{diasSemana[dia as keyof typeof diasSemana]}</h3>
      <Badge variant="secondary" className="ml-auto">
        {turmas.length} turmas
      </Badge>
    </div>
    <div className="space-y-3">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
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
  const diasComTurmas = diasOrdenados.filter(dia => turmasPorDia?.[dia]?.length > 0);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Calendário de Aulas</h1>
      </div>

      {diasComTurmas.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma turma encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {diasComTurmas.map((dia) => (
            <DiaContainer
              key={dia}
              dia={dia}
              turmas={turmasPorDia[dia]}
            />
          ))}
        </div>
      )}
    </div>
  );
}