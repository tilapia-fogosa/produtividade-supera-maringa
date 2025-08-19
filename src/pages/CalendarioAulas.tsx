
import { Calendar, Clock, Users, User, ChevronLeft, ChevronRight, FileText, List, UserMinus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Switch } from "@/components/ui/switch";
import { useCalendarioTurmas, CalendarioTurma } from "@/hooks/use-calendario-turmas";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import { TurmaModal } from "@/components/turmas/TurmaModal";
import { ListaReposicoesModal } from "@/components/turmas/ListaReposicoesModal";
import ListaAulasExperimentaisModal from "@/components/turmas/ListaAulasExperimentaisModal";
import ListaFaltasFuturasModal from "@/components/turmas/ListaFaltasFuturasModal";

const diasSemana = {
  segunda: "SEG", 
  terca: "TER",
  quarta: "QUA",
  quinta: "QUI",
  sexta: "SEX",
  sabado: "SAB"
};

const diasSemanaNomes = {
  segunda: "Segunda",
  terca: "Terça",
  quarta: "Quarta",
  quinta: "Quinta",
  sexta: "Sexta",
  sabado: "Sábado"
};

// Função para calcular as datas da semana atual (segunda a sábado)
const calcularDatasSemanais = (dataReferencia: Date): Date[] => {
  const diaSemana = dataReferencia.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
  
  // Calcular quantos dias voltar para chegar na segunda-feira
  const diasParaVoltar = diaSemana === 0 ? 6 : diaSemana - 1;
  
  // Calcular a segunda-feira da semana
  const segunda = new Date(dataReferencia);
  segunda.setDate(dataReferencia.getDate() - diasParaVoltar);
  
  // Gerar as 6 datas da semana (segunda a sábado)
  const datasSemanais = [];
  const ano = segunda.getFullYear();
  const mes = segunda.getMonth();
  const diaInicial = segunda.getDate();
  
  for (let i = 0; i < 6; i++) {
    const data = new Date(ano, mes, diaInicial + i);
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

// Função para converter horário em slot de 30 minutos
const horarioParaSlot = (horario: string) => {
  const [hora, minuto] = horario.split(":").map(num => parseInt(num));
  // Grid começa às 6h, cada slot é de 30 min
  // 6:00 = slot 0, 6:30 = slot 1, 7:00 = slot 2, etc.
  const horaRelativa = hora - 6;
  const slotsPorHora = 2; // 30 min cada
  return (horaRelativa * slotsPorHora) + (minuto >= 30 ? 1 : 0);
};

// Função para determinar o dia da semana baseado no enum (excluindo domingo)
const obterDiaSemanaIndex = (diaSemana: string) => {
  const mapping: Record<string, number> = {
    'segunda': 0,
    'terca': 1,
    'quarta': 2,
    'quinta': 3,
    'sexta': 4,
    'sabado': 5
  };
  return mapping[diaSemana] !== undefined ? mapping[diaSemana] : -1;
};

// Componente para o bloco de turma
const BlocoTurma = ({ turma, onClick }: { turma: CalendarioTurma; onClick?: () => void }) => {
  // Calcular vagas disponíveis
  const capacidadeMaxima = turma.categoria === 'infantil' ? 6 : 12;
  const ocupacao = turma.total_alunos_ativos + turma.total_reposicoes + turma.total_aulas_experimentais;
  const vagasDisponiveis = Math.max(0, capacidadeMaxima - ocupacao);
  
  // Determinar cor das vagas
  const getVagasColor = (vagas: number, capacidade: number) => {
    const percentualVagas = (vagas / capacidade) * 100;
    if (percentualVagas > 40) return 'text-emerald-600';
    if (percentualVagas > 20) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div 
      className="bg-blue-100 border border-blue-200 rounded-md p-2 h-full cursor-pointer hover:bg-blue-200 transition-colors text-xs flex flex-col justify-between"
      onClick={onClick}
    >
      <div>
        <div className="font-medium text-blue-900 mb-1 text-sm">
          {turma.categoria}
        </div>
        <div className="text-blue-700 mb-1">
          {formatarNomeProfessor(turma.professor_nome)}
        </div>
        <div className="flex items-center gap-1 text-blue-600 mb-1">
          <Users className="w-3 h-3" />
          <span>
            {turma.total_alunos_ativos}/{capacidadeMaxima}
            {turma.total_reposicoes > 0 && (
              <span className="text-red-500 font-medium"> Rep: {turma.total_reposicoes}</span>
            )}
            {turma.total_aulas_experimentais > 0 && (
              <span className="text-green-500 font-medium"> Exp: {turma.total_aulas_experimentais}</span>
            )}
          </span>
        </div>
        <div className={`text-xs font-medium ${getVagasColor(vagasDisponiveis, capacidadeMaxima)}`}>
          {vagasDisponiveis} vaga{vagasDisponiveis !== 1 ? 's' : ''} disponível{vagasDisponiveis !== 1 ? 'eis' : ''}
        </div>
      </div>
    </div>
  );
};

export default function CalendarioAulas() {
  const [semanaAtual, setSemanaAtual] = useState(new Date());
  const datasSemanais = useMemo(() => calcularDatasSemanais(semanaAtual), [semanaAtual]);
  
  // Calcular datas da semana para o hook
  const dataInicio = datasSemanais[0]; // Segunda-feira
  const dataFim = datasSemanais[5]; // Sábado
  
  // Buscar dados das turmas para a semana
  const { data: turmasPorDia, isLoading, error } = useCalendarioTurmas(dataInicio, dataFim);

  // Estados dos filtros
  const [perfisSelecionados, setPerfisSelecionados] = useState<string[]>([]);
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([
    'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'
  ]);
  const [somenteComVagas, setSomenteComVagas] = useState(false);
  
  // Estados para o modal da turma
  const [modalTurmaId, setModalTurmaId] = useState<string | null>(null);
  const [modalDataConsulta, setModalDataConsulta] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado para o modal da lista de reposições
  const [isListaReposicoesOpen, setIsListaReposicoesOpen] = useState(false);
  
  // Estado para o modal da lista de aulas experimentais
  const [isListaAulasExperimentaisOpen, setIsListaAulasExperimentaisOpen] = useState(false);

  // Estado para o modal da lista de faltas futuras
  const [isListaFaltasFuturasOpen, setIsListaFaltasFuturasOpen] = useState(false);


  // Extrair perfis únicos dos dados (excluindo domingo)
  const perfisDisponiveis = useMemo(() => {
    if (!turmasPorDia) return [];
    const perfis = new Set<string>();
    Object.entries(turmasPorDia).forEach(([dia, turmas]) => {
      // Excluir domingo
      if (dia === 'domingo') return;
      
      turmas.forEach(turma => {
        // Só considerar turmas com alunos ativos
        if (turma.categoria && turma.total_alunos_ativos > 0) {
          perfis.add(turma.categoria);
        }
      });
    });
    return Array.from(perfis).sort();
  }, [turmasPorDia]);

  // Aplicar filtros (excluindo domingo)
  const turmasFiltradasPorDia = useMemo(() => {
    if (!turmasPorDia) return {};
    
    const resultado: Record<string, CalendarioTurma[]> = {};
    
    Object.entries(turmasPorDia).forEach(([dia, turmas]) => {
      // Excluir domingo
      if (dia === 'domingo') return;
      
      if (!diasSelecionados.includes(dia)) {
        resultado[dia] = [];
        return;
      }
      
      const turmasFiltradas = turmas.filter(turma => {
        // Filtrar turmas com 0 alunos (já aplicado no hook)
        if (turma.total_alunos_ativos === 0) return false;
        
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

  // Estrutura do grid reorganizada - mapear turmas por dia da semana diretamente
  const turmasGrid = useMemo(() => {
    const grid: Record<string, CalendarioTurma[]> = {};
    
    Object.entries(turmasFiltradasPorDia).forEach(([diaSemana, turmas]) => {
      turmas.forEach(turma => {
        const slotInicio = horarioParaSlot(turma.horario_inicio);
        const chave = `${slotInicio}-${diaSemana}`;
        
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
    setPerfisSelecionados([]);
    setDiasSelecionados(['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']);
    setSomenteComVagas(false);
  };

  const selecionarTodosPerfis = () => {
    setPerfisSelecionados([...perfisDisponiveis]);
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

  // Funções para o modal da turma
  const handleTurmaClick = (turmaId: string, diaSemana: string) => {
    // Mapear o dia da semana para o índice da array datasSemanais
    const diaIndex = obterDiaSemanaIndex(diaSemana);
    const dataModal = datasSemanais[diaIndex];
    console.log('🎯 handleTurmaClick - Clicou na turma:', {
      turmaId,
      diaSemana,
      diaIndex,
      dataModal: dataModal?.toISOString().split('T')[0],
      semanaAtual: semanaAtual.toISOString().split('T')[0]
    });
    setModalTurmaId(turmaId);
    setModalDataConsulta(dataModal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalTurmaId(null);
    setModalDataConsulta(null);
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
        {/* Cabeçalho com botões de ação */}
        <div className="flex justify-end gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsListaReposicoesOpen(true)}
            className="min-w-[140px]"
          >
            <List className="w-4 h-4 mr-2" />
            Lista de Reposições
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsListaAulasExperimentaisOpen(true)}
            className="min-w-[140px]"
          >
            <Users className="w-4 h-4 mr-2" />
            Lista de Experimentais
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsListaFaltasFuturasOpen(true)}
            className="min-w-[140px]"
          >
            <UserMinus className="w-4 h-4 mr-2" />
            Lista de Faltas Futuras
          </Button>
        </div>

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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={selecionarTodosPerfis}
              className="text-xs"
              disabled={perfisSelecionados.length === perfisDisponiveis.length}
            >
              ✓ Selecionar Todos Perfis
            </Button>
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
      </div>

      {/* Grid do Calendário Reestruturado */}
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
            gridTemplateRows: `repeat(${slots.length}, 40px)`,
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

          {/* Renderizar blocos de turmas com posicionamento absoluto */}
          {Object.entries(turmasGrid).map(([chave, turmas]) => {
            const [slotStr, diaSemana] = chave.split('-');
            const slot = parseInt(slotStr);
            const diaIndex = obterDiaSemanaIndex(diaSemana);
            
            return (
              <div
                key={chave}
                className="border border-gray-300 bg-white rounded-sm overflow-hidden"
                style={{
                  gridRow: `${slot + 1} / ${slot + 5}`, // 4 slots (2 horas)
                  gridColumn: diaIndex + 2,
                  display: 'grid',
                  gridTemplateColumns: `repeat(${turmas.length}, 1fr)`,
                  gap: '2px',
                  padding: '2px',
                  zIndex: 1,
                }}
              >
                {turmas.map((turma, turmaIndex) => (
                  <BlocoTurma 
                    key={`${turma.turma_id}-${turmaIndex}`} 
                    turma={turma} 
                    onClick={() => handleTurmaClick(turma.turma_id, diaSemana)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Modal da Turma */}
      <TurmaModal 
        turmaId={modalTurmaId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        dataConsulta={modalDataConsulta || undefined}
      />
      
      {/* Modal da Lista de Reposições */}
      <ListaReposicoesModal 
        open={isListaReposicoesOpen}
        onOpenChange={setIsListaReposicoesOpen}
      />
      
      {/* Modal da Lista de Aulas Experimentais */}
      <ListaAulasExperimentaisModal 
        open={isListaAulasExperimentaisOpen}
        onOpenChange={setIsListaAulasExperimentaisOpen}
      />
      
      {/* Modal da Lista de Faltas Futuras */}
      <ListaFaltasFuturasModal 
        isOpen={isListaFaltasFuturasOpen}
        onClose={() => setIsListaFaltasFuturasOpen(false)}
      />
    </div>
  );
}
