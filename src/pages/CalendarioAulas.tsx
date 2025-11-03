
import { Calendar, Clock, Users, User, ChevronLeft, ChevronRight, FileText, List, UserMinus, MapPin, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Switch } from "@/components/ui/switch";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useCalendarioTurmas, CalendarioTurma } from "@/hooks/use-calendario-turmas";
import { useBloqueiosSala, BloqueioSala } from "@/hooks/use-bloqueios-sala";
import { useSalas } from "@/hooks/use-salas";
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
import { ReservarSalaModal } from "@/components/turmas/ReservarSalaModal";
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

// Componente para renderizar um bloqueio de sala no grid
const BlocoBloqueio = ({ 
  bloqueio, 
  corSala, 
  onEdit,
  onDelete
}: { 
  bloqueio: BloqueioSala; 
  corSala: string;
  onEdit?: () => void;
  onDelete?: () => void;
}) => {
  const corClara = clarearCor(corSala);
  
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div
          className="p-2 rounded-md border-2 transition-all text-xs h-full overflow-hidden relative cursor-pointer hover:shadow-lg"
          style={{
            backgroundColor: corClara,
            borderColor: corSala
          }}
        >
          <div className="font-semibold text-gray-900 truncate">
            🔒 {bloqueio.sala_nome}
          </div>
          <div className="text-gray-800 truncate mt-1">
            {bloqueio.titulo}
          </div>
          
          {/* Botões no canto inferior direito */}
          <div className="absolute bottom-1 right-1 flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              className="p-1 bg-white/80 hover:bg-white rounded border border-gray-300 transition-colors"
              title="Editar"
            >
              <Pencil className="w-3 h-3 text-gray-700" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="p-1 bg-red-100 hover:bg-red-200 rounded border border-red-300 transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-3 h-3 text-red-700" />
            </button>
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 z-50 bg-white" align="start">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Detalhes do Bloqueio</h4>
            <div 
              className="w-4 h-4 rounded-full border-2"
              style={{ backgroundColor: corClara, borderColor: corSala }}
            />
          </div>
          
          <div className="space-y-1 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Sala:</span>{' '}
                <span className="text-muted-foreground">{bloqueio.sala_nome}</span>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Título:</span>{' '}
                <span className="text-muted-foreground">{bloqueio.titulo}</span>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Data:</span>{' '}
                <span className="text-muted-foreground">
                  {new Date(bloqueio.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Horário:</span>{' '}
                <span className="text-muted-foreground">
                  {bloqueio.horario_inicio} - {bloqueio.horario_fim}
                </span>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs">
                {bloqueio.tipo_evento.replace('_', ' ')}
              </Badge>
            </div>
            
            {bloqueio.descricao && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">{bloqueio.descricao}</p>
              </div>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

// Componente para o bloco de turma
const BlocoTurma = ({ turma, onClick, isCompact = false }: {
  turma: CalendarioTurma; 
  onClick?: () => void; 
  isCompact?: boolean; 
}) => {
  // Calcular vagas disponíveis
  const capacidadeMaxima = turma.categoria === 'infantil' ? 6 : 12;
  const ocupacao = turma.total_alunos_ativos + turma.total_reposicoes + turma.total_aulas_experimentais - turma.total_faltas_futuras;
  const vagasDisponiveis = Math.max(0, capacidadeMaxima - ocupacao);
  
  // Determinar cor das vagas
  const getVagasColor = (vagas: number, capacidade: number) => {
    const percentualVagas = (vagas / capacidade) * 100;
    if (percentualVagas > 40) return 'text-emerald-600';
    if (percentualVagas > 20) return 'text-amber-600';
    return 'text-red-600';
  };

  const conteudoCompact = (
    <div 
      className="bg-blue-100 border border-blue-200 rounded-sm p-1 h-full cursor-pointer hover:bg-blue-200 transition-colors text-xs flex flex-col justify-between min-h-[70px]"
      onClick={onClick}
    >
      <div className="space-y-0.5">
        <div className="font-medium text-blue-900 text-xs leading-tight">
          {turma.categoria}
        </div>
        <div className="text-blue-700 text-xs leading-tight">
          {formatarNomeProfessor(turma.professor_nome)}
        </div>
        <div className="flex items-center gap-1 text-blue-600">
          <Users className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="text-xs">
            {turma.total_alunos_ativos}/{capacidadeMaxima}
          </span>
        </div>
        {(turma.total_reposicoes > 0 || turma.total_aulas_experimentais > 0 || turma.total_faltas_futuras > 0) && (
          <div className="text-xs leading-tight">
            {turma.total_reposicoes > 0 && (
              <span className="text-red-500 font-medium">Rep: {turma.total_reposicoes}</span>
            )}
            {turma.total_reposicoes > 0 && (turma.total_aulas_experimentais > 0 || turma.total_faltas_futuras > 0) && ' '}
            {turma.total_aulas_experimentais > 0 && (
              <span className="text-green-500 font-medium">Exp: {turma.total_aulas_experimentais}</span>
            )}
            {turma.total_aulas_experimentais > 0 && turma.total_faltas_futuras > 0 && ' '}
            {turma.total_faltas_futuras > 0 && (
              <span className="font-medium" style={{ color: '#e17021' }}>Fal: {turma.total_faltas_futuras}</span>
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
      className="bg-blue-100 border border-blue-200 rounded-md p-2 h-full cursor-pointer hover:bg-blue-200 transition-colors text-xs flex flex-col justify-between min-h-[90px]"
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
            {turma.total_faltas_futuras > 0 && (
              <span className="font-medium" style={{ color: '#e17021' }}> Fal: {turma.total_faltas_futuras}</span>
            )}
          </span>
        </div>
        <div className={`text-xs font-medium ${getVagasColor(vagasDisponiveis, capacidadeMaxima)}`}>
          {vagasDisponiveis} vaga{vagasDisponiveis !== 1 ? 's' : ''} disponível{vagasDisponiveis !== 1 ? 'eis' : ''}
        </div>
      </div>
    </div>
  );

  const hoverContent = (
    <HoverCardContent className="w-80 z-50 bg-white" align="start">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Detalhes da Turma</h4>
          <Badge className="bg-blue-500">{turma.categoria}</Badge>
        </div>
        
        <div className="space-y-1 text-sm">
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">Professor:</span>{' '}
              <span className="text-muted-foreground">{turma.professor_nome}</span>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">Sala:</span>{' '}
              <span className="text-muted-foreground">{turma.sala}</span>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">Horário:</span>{' '}
              <span className="text-muted-foreground">{turma.horario_inicio}</span>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Users className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">Alunos Ativos:</span>{' '}
              <span className="text-muted-foreground">{turma.total_alunos_ativos} / {capacidadeMaxima}</span>
            </div>
          </div>
          
          <div className="pt-2 border-t space-y-1">
            {turma.total_reposicoes > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-red-500 border-red-500">
                  {turma.total_reposicoes} Reposição{turma.total_reposicoes !== 1 ? 'ões' : ''}
                </Badge>
              </div>
            )}
            {turma.total_aulas_experimentais > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-500 border-green-500">
                  {turma.total_aulas_experimentais} Experimental{turma.total_aulas_experimentais !== 1 ? 'is' : ''}
                </Badge>
              </div>
            )}
            {turma.total_faltas_futuras > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-orange-500" style={{ color: '#e17021' }}>
                  {turma.total_faltas_futuras} Falta{turma.total_faltas_futuras !== 1 ? 's' : ''} Futura{turma.total_faltas_futuras !== 1 ? 's' : ''}
                </Badge>
              </div>
            )}
            <div className={`text-sm font-medium ${getVagasColor(vagasDisponiveis, capacidadeMaxima)}`}>
              {vagasDisponiveis} vaga{vagasDisponiveis !== 1 ? 's' : ''} disponível{vagasDisponiveis !== 1 ? 'eis' : ''}
            </div>
          </div>
        </div>
      </div>
    </HoverCardContent>
  );

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        {isCompact ? conteudoCompact : conteudoNormal}
      </HoverCardTrigger>
      {hoverContent}
    </HoverCard>
  );
};

export default function CalendarioAulas() {
  const { activeUnit } = useActiveUnit();
  const [semanaAtual, setSemanaAtual] = useState(new Date());
  const [mostrarBloqueios, setMostrarBloqueios] = useState(true);
  const datasSemanais = useMemo(() => calcularDatasSemanais(semanaAtual), [semanaAtual]);
  
  // Calcular datas da semana para o hook
  const dataInicio = datasSemanais[0]; // Segunda-feira
  const dataFim = datasSemanais[5]; // Sábado
  
  // Buscar dados das turmas para a semana
  const { data: turmasPorDia, isLoading, error } = useCalendarioTurmas(dataInicio, dataFim);
  const { data: bloqueiosPorDia } = useBloqueiosSala(dataInicio, dataFim, activeUnit?.id);
  const { data: salas } = useSalas(activeUnit?.id);

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

  // Estado para o modal de reservar sala
  const [isReservarSalaOpen, setIsReservarSalaOpen] = useState(false);
  
  // Estados para excluir bloqueio
  const [bloqueioParaExcluir, setBloqueioParaExcluir] = useState<BloqueioSala | null>(null);
  const excluirEventoSala = useExcluirEventoSala();


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

  // Selecionar todos os perfis por padrão quando os perfis disponíveis mudarem
  useEffect(() => {
    if (perfisDisponiveis.length > 0 && perfisSelecionados.length === 0) {
      setPerfisSelecionados(perfisDisponiveis);
    }
  }, [perfisDisponiveis]);

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

  const handleEditarBloqueio = (bloqueio: BloqueioSala) => {
    console.log('✏️ Editar bloqueio:', bloqueio);
    // TODO: Implementar edição de bloqueio
    alert('Funcionalidade de edição em desenvolvimento');
  };

  const handleExcluirBloqueio = (bloqueio: BloqueioSala) => {
    setBloqueioParaExcluir(bloqueio);
  };

  const confirmarExclusao = () => {
    if (bloqueioParaExcluir) {
      excluirEventoSala.mutate(bloqueioParaExcluir.id, {
        onSuccess: () => {
          console.log('✅ Bloqueio excluído com sucesso');
          setBloqueioParaExcluir(null);
        },
        onError: (error) => {
          console.error('❌ Erro ao excluir bloqueio:', error);
          alert('Erro ao excluir bloqueio. Tente novamente.');
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
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReservarSalaOpen(true)}
            className="min-w-[140px]"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Reservar Sala
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
            
            <div className="flex items-center gap-2 pl-4 border-l">
              <Switch
                checked={mostrarBloqueios}
                onCheckedChange={setMostrarBloqueios}
                id="mostrar-bloqueios"
              />
              <label htmlFor="mostrar-bloqueios" className="text-sm font-medium cursor-pointer">
                Mostrar Bloqueios de Sala
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
            gridTemplateRows: `repeat(${slots.length}, 50px)`, // Aumentado de 40px para 50px
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

          {/* Renderizar bloqueios de sala primeiro */}
          {mostrarBloqueios && bloqueiosPorDia && salas && Object.entries(bloqueiosPorDia).map(([dia, bloqueios]) => {
            const diaIndex = obterDiaSemanaIndex(dia);
            if (diaIndex === -1) return null;
            
            return bloqueios.map((bloqueio) => {
              const slotInicio = horarioParaSlot(bloqueio.horario_inicio);
              if (slotInicio === null) return null;
              
              // Calcular duração em slots
              const [horaIni, minIni] = bloqueio.horario_inicio.split(':').map(Number);
              const [horaFim, minFim] = bloqueio.horario_fim.split(':').map(Number);
              const minutosIni = horaIni * 60 + minIni;
              const minutosFim = horaFim * 60 + minFim;
              const duracaoMinutos = minutosFim - minutosIni;
              const duracaoSlots = Math.ceil(duracaoMinutos / 30);
              
              // Calcular quantos elementos existem neste horário
              const diaSemanaChave = dia as keyof typeof diasSemana;
              const turmasNesseHorario = turmasGrid[`${slotInicio}-${diaSemanaChave}`] || [];
              
              // Contar bloqueios que começam no mesmo horário
              const bloqueiosNesseHorario = bloqueios.filter(b => 
                horarioParaSlot(b.horario_inicio) === slotInicio
              );
              
              const totalElementos = turmasNesseHorario.length + bloqueiosNesseHorario.length;
              const indexBloqueio = bloqueiosNesseHorario.findIndex(b => b.id === bloqueio.id);
              const widthPercent = 100 / totalElementos;
              const leftPercent = (turmasNesseHorario.length + indexBloqueio) * widthPercent;
              
              // Buscar cor da sala
              const sala = salas.find(s => s.id === bloqueio.sala_id);
              const corSala = sala?.cor_calendario || '#9CA3AF';
              
              return (
                <div
                  key={bloqueio.id}
                  className="border border-gray-300 rounded-sm overflow-hidden absolute"
                  style={{
                    gridRow: `${slotInicio + 1} / ${slotInicio + 1 + duracaoSlots}`,
                    gridColumn: diaIndex + 2,
                    width: `${widthPercent}%`,
                    left: `${leftPercent}%`,
                    height: '100%',
                    zIndex: 2,
                    padding: '1px'
                  }}
                >
                  <BlocoBloqueio 
                    bloqueio={bloqueio}
                    corSala={corSala}
                    onEdit={() => handleEditarBloqueio(bloqueio)}
                    onDelete={() => handleExcluirBloqueio(bloqueio)}
                  />
                </div>
              );
            });
          })}

          {/* Renderizar blocos de turmas */}
          {Object.entries(turmasGrid).map(([chave, turmas]) => {
            const [slotStr, diaSemana] = chave.split('-');
            const slot = parseInt(slotStr);
            const diaIndex = obterDiaSemanaIndex(diaSemana);
            
            // Contar bloqueios que começam no mesmo horário
            const bloqueiosNesseHorario = mostrarBloqueios && bloqueiosPorDia && bloqueiosPorDia[diaSemana]
              ? bloqueiosPorDia[diaSemana].filter(b => horarioParaSlot(b.horario_inicio) === slot)
              : [];
            
            const totalElementos = turmas.length + bloqueiosNesseHorario.length;
            
            // Determinar altura baseada no número de turmas
            const alturaSlots = turmas.length > 2 ? 5 : 4;
            const isCompact = turmas.length > 1;
            
            return turmas.map((turma, turmaIndex) => {
              const widthPercent = 100 / totalElementos;
              const leftPercent = turmaIndex * widthPercent;
              
              return (
                <div
                  key={`${turma.turma_id}-${turmaIndex}`}
                  className="border border-gray-300 bg-white rounded-sm overflow-hidden absolute"
                  style={{
                    gridRow: `${slot + 1} / ${slot + 1 + alturaSlots}`,
                    gridColumn: diaIndex + 2,
                    width: `${widthPercent}%`,
                    left: `${leftPercent}%`,
                    height: '100%',
                    padding: '1px',
                    zIndex: 1,
                  }}
                >
                  <BlocoTurma 
                    turma={turma} 
                    onClick={() => handleTurmaClick(turma.turma_id, diaSemana)}
                    isCompact={isCompact}
                  />
                </div>
              );
            });
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
      
      {/* Modal de Reservar Sala */}
      <ReservarSalaModal 
        isOpen={isReservarSalaOpen}
        onClose={() => setIsReservarSalaOpen(false)}
      />
      
      {/* Dialog de confirmação para excluir bloqueio */}
      <AlertDialog open={!!bloqueioParaExcluir} onOpenChange={(open) => !open && setBloqueioParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Bloqueio</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o bloqueio "{bloqueioParaExcluir?.titulo}" da sala {bloqueioParaExcluir?.sala_nome}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
