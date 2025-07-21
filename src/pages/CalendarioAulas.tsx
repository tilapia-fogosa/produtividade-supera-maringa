
import { Calendar, Clock, Users, User, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Switch } from "@/components/ui/switch";
import { useCalendarioTurmas, CalendarioTurma } from "@/hooks/use-calendario-turmas";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";

const diasSemana = {
  domingo: "DOM",
  segunda: "SEG",
  terca: "TER", 
  quarta: "QUA",
  quinta: "QUI",
  sexta: "SEX",
  sabado: "SAB"
};

const diasSemanaNomes = {
  domingo: "Domingo",
  segunda: "Segunda",
  terca: "Terça", 
  quarta: "Quarta",
  quinta: "Quinta",
  sexta: "Sexta",
  sabado: "Sábado"
};

// Função para calcular as datas da semana atual
const calcularDatasSemanais = (dataReferencia: Date) => {
  const inicio = new Date(dataReferencia);
  const diaSemana = inicio.getDay(); // 0 = domingo, 1 = segunda, etc.
  
  // Calcular o domingo da semana (início da semana)
  inicio.setDate(inicio.getDate() - diaSemana);
  
  const datasSemanais = [];
  for (let i = 0; i < 7; i++) {
    const data = new Date(inicio);
    data.setDate(inicio.getDate() + i);
    datasSemanais.push(data);
  }
  
  return datasSemanais;
};

// Função para formatar nome do professor
const formatarNomeProfessor = (nomeCompleto: string) => {
  if (!nomeCompleto) return "";
  const partes = nomeCompleto.trim().split(" ");
  if (partes.length === 1) return partes[0];
  
  const primeiroNome = partes[0];
  const ultimoSobrenome = partes[partes.length - 1];
  const primeiraLetra = ultimoSobrenome.charAt(0).toUpperCase();
  
  return `${primeiroNome} ${primeiraLetra}.`;
};

// Função para converter horário em linha do grid
const horarioParaLinha = (horario: string) => {
  const [hora] = horario.split(":");
  const horaNum = parseInt(hora);
  // Grid começa às 6h, então 6h = linha 0, 7h = linha 1, etc.
  return horaNum - 6;
};

// Função para determinar o dia da semana baseado no enum
const obterDiaSemanaIndex = (diaSemana: string) => {
  const mapping: Record<string, number> = {
    'domingo': 0,
    'segunda': 1,
    'terca': 2,
    'quarta': 3,
    'quinta': 4,
    'sexta': 5,
    'sabado': 6
  };
  return mapping[diaSemana] || 0;
};

// Componente para o bloco de turma
const BlocoTurma = ({ turma }: { turma: CalendarioTurma }) => {
  return (
    <div className="bg-blue-100 border border-blue-200 rounded-md p-2 mb-1 cursor-pointer hover:bg-blue-200 transition-colors text-xs">
      <div className="font-medium text-blue-900 mb-1">
        {turma.categoria}
      </div>
      <div className="text-blue-700">
        {formatarNomeProfessor(turma.professor_nome)}
      </div>
      <div className="flex items-center gap-1 text-blue-600">
        <Users className="w-3 h-3" />
        <span>{turma.total_alunos_ativos}/12</span>
      </div>
    </div>
  );
};

// Componente para célula do grid
const CelulaGrid = ({ turmas, horario, data }: { 
  turmas: CalendarioTurma[], 
  horario: string,
  data: Date 
}) => {
  return (
    <div className="border-r border-b border-gray-200 h-16 p-1 overflow-hidden">
      {turmas.map((turma) => (
        <BlocoTurma key={turma.turma_id} turma={turma} />
      ))}
    </div>
  );
};

export default function CalendarioAulas() {
  const { data: turmasPorDia, isLoading, error } = useCalendarioTurmas();
  const [semanaAtual, setSemanaAtual] = useState(new Date());

  // Estados dos filtros
  const [perfisSelecionados, setPerfisSelecionados] = useState<string[]>([
    '60+', '60+S', 'Adolescente', 'Adolescentes', 'Adultos', 'Júnior', 'Mirim', 'BPA', 'C'
  ]);
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([
    'domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'
  ]);
  const [somenteComVagas, setSomenteComVagas] = useState(false);

  // Calcular datas da semana
  const datasSemanais = useMemo(() => calcularDatasSemanais(semanaAtual), [semanaAtual]);

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

  // Organizar turmas por grid (horário × dia)
  const gridTurmas = useMemo(() => {
    const grid: Record<string, CalendarioTurma[]> = {};
    
    Object.entries(turmasFiltradasPorDia).forEach(([diaSemana, turmas]) => {
      const diaIndex = obterDiaSemanaIndex(diaSemana);
      
      turmas.forEach(turma => {
        const linha = horarioParaLinha(turma.horario_inicio);
        const chave = `${linha}-${diaIndex}`;
        
        if (!grid[chave]) {
          grid[chave] = [];
        }
        grid[chave].push(turma);
      });
    });
    
    return grid;
  }, [turmasFiltradasPorDia]);

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
    setDiasSelecionados(['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']);
    setSomenteComVagas(false);
  };

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

  // Horários do grid (6h às 20h)
  const horarios = Array.from({ length: 15 }, (_, i) => {
    const hora = i + 6;
    return `${hora.toString().padStart(2, '0')}:00`;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Calendário de Aulas</h1>
        </div>
        <Skeleton className="h-96 w-full" />
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

  const hoje = new Date();
  const mesAno = semanaAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header com navegação */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Calendário de Aulas</h1>
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
            variant="outline"
            size="sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Seção de Filtros */}
      <div className="space-y-4 mb-6 p-4 bg-muted/20 rounded-lg">
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

        <div className="space-y-2">
          <label className="text-sm font-medium">Dia da Semana:</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(diasSemanaNomes).map(([chave, nome]) => (
              <Toggle
                key={chave}
                pressed={diasSelecionados.includes(chave)}
                onPressedChange={() => toggleDia(chave)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {nome}
              </Toggle>
            ))}
          </div>
        </div>

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

      {/* Grid do Calendário */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Header dos dias */}
        <div className="grid grid-cols-8 bg-gray-50">
          <div className="p-3 text-center border-r border-gray-200 text-sm font-medium">
            GMT-03
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

        {/* Grid de horários */}
        <div className="grid grid-cols-8">
          {horarios.map((horario, linhaIndex) => (
            <div key={horario} className="contents">
              {/* Coluna de horário */}
              <div className="p-3 text-center border-r border-b border-gray-200 text-sm text-muted-foreground bg-gray-50">
                {horario}
              </div>
              
              {/* Células dos dias */}
              {datasSemanais.map((data, colunaIndex) => {
                const chaveGrid = `${linhaIndex}-${colunaIndex}`;
                const turmasNaCelula = gridTurmas[chaveGrid] || [];
                
                return (
                  <CelulaGrid
                    key={`${linhaIndex}-${colunaIndex}`}
                    turmas={turmasNaCelula}
                    horario={horario}
                    data={data}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
