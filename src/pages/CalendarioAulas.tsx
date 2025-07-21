
import { Calendar, Clock, Users, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Switch } from "@/components/ui/switch";
import { useCalendarioTurmas, CalendarioTurma } from "@/hooks/use-calendario-turmas";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";

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

  // Estados dos filtros
  const [perfisSelecionados, setPerfisSelecionados] = useState<string[]>([
    '60+', '60+S', 'Adolescente', 'Adolescentes', 'Adultos', 'Júnior', 'Mirim', 'BPA', 'C'
  ]);
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([
    'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'
  ]);
  const [somenteComVagas, setSomenteComVagas] = useState(false);

  // Extrair perfis únicos dos dados
  const perfisDisponiveis = useMemo(() => {
    if (!turmasPorDia) return [];
    const perfis = new Set<string>();
    Object.values(turmasPorDia).flat().forEach(turma => {
      if (turma.categoria) perfis.add(turma.categoria);
    });
    return Array.from(perfis).sort();
  }, [turmasPorDia]);

  // Aplicar filtros
  const turmasFiltradasPorDia = useMemo(() => {
    if (!turmasPorDia) return {};
    
    const resultado: Record<string, CalendarioTurma[]> = {};
    
    Object.entries(turmasPorDia).forEach(([dia, turmas]) => {
      if (!diasSelecionados.includes(dia)) {
        resultado[dia] = [];
        return;
      }
      
      const turmasFiltradas = turmas.filter(turma => {
        // Filtro por perfil
        if (!perfisSelecionados.includes(turma.categoria)) return false;
        
        // Filtro por vagas (menos de 12 alunos)
        if (somenteComVagas && turma.total_alunos_ativos >= 12) return false;
        
        return true;
      });
      
      resultado[dia] = turmasFiltradas;
    });
    
    return resultado;
  }, [turmasPorDia, perfisSelecionados, diasSelecionados, somenteComVagas]);

  const togglePerfil = (perfil: string) => {
    setPerfisSelecionados(prev => 
      prev.includes(perfil) 
        ? prev.filter(p => p !== perfil)
        : [...prev, perfil]
    );
  };

  const toggleDia = (dia: string) => {
    setDiasSelecionados(prev => 
      prev.includes(dia) 
        ? prev.filter(d => d !== dia)
        : [...prev, dia]
    );
  };

  const limparFiltros = () => {
    setPerfisSelecionados(['60+', '60+S', 'Adolescente', 'Adolescentes', 'Adultos', 'Júnior', 'Mirim', 'BPA', 'C']);
    setDiasSelecionados(['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']);
    setSomenteComVagas(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Calendário de Aulas</h1>
        </div>
        {/* Skeleton dos filtros */}
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-16" />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20" />
              ))}
            </div>
          </div>
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

      {/* Seção de Filtros */}
      <div className="space-y-4 mb-6 p-4 bg-muted/20 rounded-lg">
        {/* Filtro por Perfil */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Perfil:</label>
          <div className="flex flex-wrap gap-2">
            {perfisDisponiveis.map((perfil) => (
              <Toggle
                key={perfil}
                pressed={perfisSelecionados.includes(perfil)}
                onPressedChange={() => togglePerfil(perfil)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {perfil}
              </Toggle>
            ))}
          </div>
        </div>

        {/* Filtro por Dia da Semana */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Dia da Semana:</label>
          <div className="flex flex-wrap gap-2">
            {diasOrdenados.map((dia) => (
              <Toggle
                key={dia}
                pressed={diasSelecionados.includes(dia)}
                onPressedChange={() => toggleDia(dia)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {diasSemana[dia as keyof typeof diasSemana]}
              </Toggle>
            ))}
          </div>
        </div>

        {/* Filtro Somente Vagas e Limpar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={somenteComVagas}
              onCheckedChange={setSomenteComVagas}
              id="somente-vagas"
            />
            <label htmlFor="somente-vagas" className="text-sm font-medium cursor-pointer">
              Somente Vagas Disponíveis (menos de 12 alunos)
            </label>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={limparFiltros}
            className="text-xs"
          >
            🔄 Limpar Filtros
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2 h-[calc(100vh-350px)] overflow-hidden">
        {diasOrdenados.map((dia) => (
          <div key={dia} className="border-r last:border-r-0 pr-2 last:pr-0">
            <DiaContainer
              dia={dia}
              turmas={turmasFiltradasPorDia?.[dia] || []}
            />
          </div>
        ))}
      </div>

      {diasOrdenados.every(dia => !turmasFiltradasPorDia?.[dia]?.length) && (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma turma encontrada com os filtros aplicados.</p>
        </div>
      )}
    </div>
  );
}
