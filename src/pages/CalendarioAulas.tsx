
import { Calendar, Clock, Users, User, ChevronLeft, ChevronRight, FileText, List, UserMinus, MapPin, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Switch } from "@/components/ui/switch";
import { useCalendarioEventosUnificados, CalendarioEvento } from "@/hooks/use-calendario-eventos-unificados";
import { useExcluirEventoSala } from "@/hooks/use-excluir-evento-sala";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useState, useMemo, useEffect } from "react";
import { TurmaModal } from "@/components/turmas/TurmaModal";
import { ListaReposicoesModal } from "@/components/turmas/ListaReposicoesModal";
import ListaAulasExperimentaisModal from "@/components/turmas/ListaAulasExperimentaisModal";
import ListaFaltasFuturasModal from "@/components/turmas/ListaFaltasFuturasModal";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";

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
const horarioParaSlot = (horario: string | null) => {
  if (!horario) return 0; // Retorna slot 0 se horário for null/undefined
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

// Função para clarear cores (converter para tons mais claros)
const clarearCor = (hex: string): string => {
  // Remove o # se existir
  hex = hex.replace('#', '');
  
  // Converte hex para RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Clarear (blend com branco em 70%)
  const newR = Math.round(r + (255 - r) * 0.7);
  const newG = Math.round(g + (255 - g) * 0.7);
  const newB = Math.round(b + (255 - b) * 0.7);
  
  // Converter de volta para hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
};

// Função para calcular duração da aula em minutos baseado no perfil
const calcularDuracaoAula = (perfil: string): number => {
  // Todas as turmas têm 2 horas de duração
  return 120;
};

// Componente para renderizar um bloqueio/evento de sala no grid
const BlocoEvento = ({ 
  evento, 
  onEdit,
  onDelete
}: { 
  evento: CalendarioEvento; 
  onEdit?: () => void;
  onDelete?: () => void;
}) => {
  const corSala = evento.sala_cor || '#9CA3AF';
  const corClara = clarearCor(corSala);
  
  return (
    <div
      className="p-2 rounded-md border-2 transition-all text-xs h-full overflow-hidden relative cursor-pointer"
      style={{
        backgroundColor: corClara,
        borderColor: corSala
      }}
    >
      <div className="font-semibold text-gray-900 truncate">
        🔒 {evento.sala_nome}
      </div>
      <div className="text-gray-800 truncate mt-1">
        {evento.titulo}
      </div>
      
      {/* Botões no canto inferior direito */}
      <div className="absolute bottom-1 right-1 flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}
          className="p-1 bg-white/80 rounded border border-gray-300 transition-colors"
          title="Editar"
        >
          <Pencil className="w-3 h-3 text-gray-700" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="p-1 bg-red-100 rounded border border-red-300 transition-colors"
          title="Excluir"
        >
          <Trash2 className="w-3 h-3 text-red-700" />
        </button>
      </div>
    </div>
  );
};

// Componente para o bloco de turma
const BlocoTurma = ({ evento, onClick, isCompact = false }: {
  evento: CalendarioEvento; 
  onClick?: () => void; 
  isCompact?: boolean; 
}) => {
  // Calcular vagas disponíveis: 12 - alunos - funcionários - reposições - aulas experimentais + faltas futuras
  const capacidadeMaxima = 12;
  const vagasDisponiveis = Math.max(0, 
    capacidadeMaxima 
    - evento.total_alunos_ativos 
    - evento.total_funcionarios_ativos 
    - (evento.total_reposicoes || 0) 
    - (evento.total_aulas_experimentais || 0) 
    + (evento.total_faltas_futuras || 0)
  );
  
  // Determinar cor das vagas
  const getVagasColor = (vagas: number, capacidade: number) => {
    const percentualVagas = (vagas / capacidade) * 100;
    if (percentualVagas > 40) return 'text-emerald-600';
    if (percentualVagas > 20) return 'text-amber-600';
    return 'text-red-600';
  };

  const conteudoCompact = (
    <div 
      className="bg-blue-100 border border-blue-200 rounded-sm p-1 h-full cursor-pointer transition-colors text-xs flex flex-col justify-between min-h-[70px]"
      onClick={onClick}
    >
      <div className="space-y-0.5">
        <div className="font-semibold text-blue-900 text-sm leading-tight mb-0.5">
          {evento.titulo}
        </div>
        <div className="font-medium text-blue-900 text-xs leading-tight">
          {evento.perfil}
        </div>
        <div className="text-blue-700 text-xs leading-tight">
          {formatarNomeProfessor(evento.professor_nome || '')}
        </div>
        <div className="flex items-center gap-1 text-blue-600">
          <Users className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="text-xs">
            {evento.total_alunos_ativos}/{capacidadeMaxima}
          </span>
        </div>
        {(evento.total_reposicoes > 0 || evento.total_aulas_experimentais > 0 || evento.total_faltas_futuras > 0) && (
          <div className="text-xs leading-tight">
            {evento.total_reposicoes > 0 && (
              <span className="text-red-500 font-medium">Rep: {evento.total_reposicoes}</span>
            )}
            {evento.total_reposicoes > 0 && (evento.total_aulas_experimentais > 0 || evento.total_faltas_futuras > 0) && ' '}
            {evento.total_aulas_experimentais > 0 && (
              <span className="text-green-500 font-medium">Exp: {evento.total_aulas_experimentais}</span>
            )}
            {evento.total_aulas_experimentais > 0 && evento.total_faltas_futuras > 0 && ' '}
            {evento.total_faltas_futuras > 0 && (
              <span className="font-medium" style={{ color: '#e17021' }}>Fal: {evento.total_faltas_futuras}</span>
            )}
          </div>
        )}
        <div className={`text-xs font-medium leading-tight ${getVagasColor(vagasDisponiveis, capacidadeMaxima)}`}>
          {vagasDisponiveis} vaga{vagasDisponiveis !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );

  const conteudoNormal = (
    <div 
      className="bg-blue-100 border border-blue-200 rounded-md p-2 h-full cursor-pointer transition-colors text-xs flex flex-col justify-between min-h-[90px]"
      onClick={onClick}
    >
      <div>
        <div className="font-semibold text-blue-900 mb-1 text-base">
          {evento.titulo}
        </div>
        <div className="font-medium text-blue-900 mb-1 text-sm">
          {evento.perfil}
        </div>
        <div className="text-blue-700 mb-1">
          {formatarNomeProfessor(evento.professor_nome || '')}
        </div>
        <div className="flex items-center gap-1 text-blue-600 mb-1">
          <Users className="w-3 h-3" />
          <span>
            {evento.total_alunos_ativos}/{capacidadeMaxima}
            {evento.total_reposicoes > 0 && (
              <span className="text-red-500 font-medium"> Rep: {evento.total_reposicoes}</span>
            )}
            {evento.total_aulas_experimentais > 0 && (
              <span className="text-green-500 font-medium"> Exp: {evento.total_aulas_experimentais}</span>
            )}
            {evento.total_faltas_futuras > 0 && (
              <span className="font-medium" style={{ color: '#e17021' }}> Fal: {evento.total_faltas_futuras}</span>
            )}
          </span>
        </div>
        <div className={`text-xs font-medium ${getVagasColor(vagasDisponiveis, capacidadeMaxima)}`}>
          {vagasDisponiveis} vaga{vagasDisponiveis !== 1 ? 's' : ''} disponível{vagasDisponiveis !== 1 ? 'eis' : ''}
        </div>
      </div>
    </div>
  );

  return isCompact ? conteudoCompact : conteudoNormal;
};

export default function CalendarioAulas() {
  const { activeUnit } = useActiveUnit();
  const [semanaAtual, setSemanaAtual] = useState(new Date());
  const datasSemanais = useMemo(() => calcularDatasSemanais(semanaAtual), [semanaAtual]);
  
  // Calcular datas da semana para o hook
  const dataInicio = datasSemanais[0]; // Segunda-feira
  const dataFim = datasSemanais[5]; // Sábado
  
  // Buscar eventos unificados (turmas + bloqueios de sala)
  const { data: eventosPorDia, isLoading, error } = useCalendarioEventosUnificados(
    dataInicio, 
    dataFim, 
    activeUnit?.id
  );

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
  
  // Estados para excluir evento
  const [eventoParaExcluir, setEventoParaExcluir] = useState<CalendarioEvento | null>(null);
  const excluirEventoSala = useExcluirEventoSala();


  // Extrair perfis únicos dos dados (excluindo domingo e eventos de sala)
  const perfisDisponiveis = useMemo(() => {
    if (!eventosPorDia) return [];
    const perfis = new Set<string>();
    Object.entries(eventosPorDia).forEach(([dia, eventos]) => {
      // Excluir domingo
      if (dia === 'domingo') return;
      
      eventos.forEach(evento => {
        // Só considerar turmas (não eventos de sala)
        if (evento.tipo_evento === 'turma' && evento.perfil) {
          perfis.add(evento.perfil);
        }
      });
    });
    const resultado = Array.from(perfis).sort();
    console.log('🎯 Perfis disponíveis encontrados:', resultado);
    console.log('📊 Dados por dia:', eventosPorDia);
    return resultado;
  }, [eventosPorDia]);

  // Selecionar todos os perfis por padrão quando os perfis disponíveis mudarem
  useEffect(() => {
    if (perfisDisponiveis.length > 0 && perfisSelecionados.length === 0) {
      setPerfisSelecionados(perfisDisponiveis);
    }
  }, [perfisDisponiveis]);

  // Aplicar filtros (excluindo domingo)
  const eventosFiltradasPorDia = useMemo(() => {
    if (!eventosPorDia) return {};
    
    const resultado: Record<string, CalendarioEvento[]> = {};
    
    Object.entries(eventosPorDia).forEach(([dia, eventos]) => {
      // Excluir domingo
      if (dia === 'domingo') return;
      
      if (!diasSelecionados.includes(dia)) {
        resultado[dia] = [];
        return;
      }
      
      const eventosFiltrados = eventos.filter(evento => {
        // Filtrar APENAS turmas (não mostrar eventos de sala)
        if (evento.tipo_evento !== 'turma') return false;
        
        // Para turmas, aplicar filtros
        if (evento.total_alunos_ativos === 0) return false;
        
        // Filtro por perfil
        if (evento.perfil && !perfisSelecionados.includes(evento.perfil)) return false;
        
        // Filtro por vagas (menos de 12 alunos)
        if (somenteComVagas && evento.total_alunos_ativos >= 12) return false;
        
        return true;
      });
      
      resultado[dia] = eventosFiltrados;
    });
    
    return resultado;
  }, [eventosPorDia, perfisSelecionados, diasSelecionados, somenteComVagas]);

  // Estrutura do grid reorganizada - agrupar eventos sobrepostos temporalmente
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

  const handleEditarEvento = (evento: CalendarioEvento) => {
    console.log('✏️ Editar evento:', evento);
    // TODO: Implementar edição de evento
    alert('Funcionalidade de edição em desenvolvimento');
  };

  const handleExcluirEvento = (evento: CalendarioEvento) => {
    setEventoParaExcluir(evento);
  };

  const confirmarExclusao = () => {
    if (eventoParaExcluir && eventoParaExcluir.tipo_evento === 'evento_sala') {
      excluirEventoSala.mutate(eventoParaExcluir.evento_id, {
        onSuccess: () => {
          console.log('✅ Evento excluído com sucesso');
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
          <div className="flex items-center gap-4">
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

          {/* Renderizar eventos unificados (turmas + bloqueios) */}
          {(() => {
            // Renderizar cada célula do grid com eventos
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
                          {evento.tipo_evento === 'turma' ? (
                            <BlocoTurma 
                              evento={evento} 
                              onClick={() => handleTurmaClick(evento.evento_id, diaSemana)}
                              isCompact={isCompact}
                            />
                          ) : (
                            <BlocoEvento 
                              evento={evento}
                              onEdit={() => handleEditarEvento(evento)}
                              onDelete={() => handleExcluirEvento(evento)}
                            />
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
      
      {/* Dialog de confirmação para excluir evento */}
      <AlertDialog open={!!eventoParaExcluir} onOpenChange={(open) => !open && setEventoParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {eventoParaExcluir?.tipo_evento === 'turma' ? 'Aula' : 'Evento'}</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{eventoParaExcluir?.titulo}" da sala {eventoParaExcluir?.sala_nome}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              className="bg-red-600 hover:bg-red-700"
              disabled={eventoParaExcluir?.tipo_evento === 'turma'}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
