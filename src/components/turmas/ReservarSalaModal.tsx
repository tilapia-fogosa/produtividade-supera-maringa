import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { useHorariosDisponiveisSalas } from "@/hooks/use-horarios-disponiveis-salas";
import { useSalas } from "@/hooks/use-salas";
import { useResponsaveis } from "@/hooks/use-responsaveis";
import { useCriarEventoSala } from "@/hooks/use-criar-evento-sala";
import { ChevronLeft, Clock, MapPin, User, Calendar as CalendarIcon } from "lucide-react";
import { ptBR } from "date-fns/locale";
import { 
  OPCOES_DURACAO, 
  TIPOS_EVENTO, 
  obterHorarioFuncionamento, 
  calcularHorarioFim,
  horarioEstaNoFuncionamento 
} from "@/constants/horariosFuncionamento";

interface ReservarSalaModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitId?: string | null;
}

type Etapa = 1 | 2;

const MARINGA_UNIT_ID = '0df79a04-444e-46ee-b218-59e4b1835f4a';

export const ReservarSalaModal: React.FC<ReservarSalaModalProps> = ({
  isOpen,
  onClose,
  unitId,
}) => {
  // Sempre usar unidade de Maringá
  const finalUnitId = MARINGA_UNIT_ID;
  
  console.log('🎯 ReservarSalaModal - usando unit_id fixo de Maringá:', finalUnitId);
  
  const [etapa, setEtapa] = useState<Etapa>(1);
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);
  const [horarioInicioSelecionado, setHorarioInicioSelecionado] = useState<string | null>(null);
  const [duracaoSelecionada, setDuracaoSelecionada] = useState<number | null>(null);
  const [salaSelecionada, setSalaSelecionada] = useState<string | null>(null);
  const [tipoEvento, setTipoEvento] = useState<string>("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [responsavelId, setResponsavelId] = useState<string>("");
  const [recorrente, setRecorrente] = useState(false);
  const [tipoRecorrencia, setTipoRecorrencia] = useState("");
  const [dataInicio, setDataInicio] = useState<Date | null>(null);
  const [dataFim, setDataFim] = useState<Date | null>(null);

  const { data: horariosDisponiveis, isLoading: loadingHorarios } = 
    useHorariosDisponiveisSalas(dataSelecionada, finalUnitId);
  
  const { data: todasSalas } = useSalas(finalUnitId);
  const { responsaveis } = useResponsaveis();
  const criarEventoMutation = useCriarEventoSala();

  // Filtrar horários disponíveis baseado na duração selecionada
  const horariosDisponiveisFiltrados = React.useMemo(() => {
    if (!horariosDisponiveis || !dataSelecionada) return [];
    
    const horarioFunc = obterHorarioFuncionamento(dataSelecionada);
    if (!horarioFunc.aberto) return [];

    return horariosDisponiveis.filter(h => 
      horarioEstaNoFuncionamento(h.horario_inicio, h.horario_fim, horarioFunc)
    );
  }, [horariosDisponiveis, dataSelecionada]);

  // Horários de início únicos (slots de 30min)
  const horariosInicio = React.useMemo(() => {
    const unique = new Map<string, any>();
    horariosDisponiveisFiltrados?.forEach(h => {
      if (!unique.has(h.horario_inicio)) {
        unique.set(h.horario_inicio, {
          horario_inicio: h.horario_inicio,
          salas_disponiveis: h.total_salas_livres
        });
      }
    });
    return Array.from(unique.values());
  }, [horariosDisponiveisFiltrados]);

  // Calcular salas disponíveis para o horário e duração selecionados
  const salasDisponiveisParaDuracao = React.useMemo(() => {
    if (!horarioInicioSelecionado || !duracaoSelecionada || !dataSelecionada) return [];
    
    const horarioFim = calcularHorarioFim(horarioInicioSelecionado, duracaoSelecionada);
    const horarioFunc = obterHorarioFuncionamento(dataSelecionada);
    
    if (!horarioEstaNoFuncionamento(horarioInicioSelecionado, horarioFim, horarioFunc)) {
      return [];
    }

    // Encontrar todas as salas que estão livres em todos os slots necessários
    const slotsNecessarios = horariosDisponiveisFiltrados.filter(h => 
      h.horario_inicio >= horarioInicioSelecionado && h.horario_inicio < horarioFim
    );

    if (slotsNecessarios.length === 0) return [];

    // Interseção de salas livres em todos os slots
    const salasLivres = slotsNecessarios[0].salas_livres_ids;
    const salasDisponiveisEmTodosSlots = salasLivres.filter(salaId =>
      slotsNecessarios.every(slot => slot.salas_livres_ids.includes(salaId))
    );

    return todasSalas?.filter(sala => salasDisponiveisEmTodosSlots.includes(sala.id)) || [];
  }, [horarioInicioSelecionado, duracaoSelecionada, horariosDisponiveisFiltrados, todasSalas, dataSelecionada]);

  const handleSubmit = async () => {
    if (!dataSelecionada || !salaSelecionada || !horarioInicioSelecionado || !duracaoSelecionada || !finalUnitId) return;

    const responsavel = responsaveis.find(r => r.id === responsavelId);
    if (!responsavel) return;

    const horarioFim = calcularHorarioFim(horarioInicioSelecionado, duracaoSelecionada);

    console.log('🔄 Criando reserva com unit_id:', finalUnitId);

    try {
      await criarEventoMutation.mutateAsync({
        sala_id: salaSelecionada,
        tipo_evento: tipoEvento,
        titulo,
        descricao,
        data: dataSelecionada.toISOString().split('T')[0],
        horario_inicio: horarioInicioSelecionado,
        horario_fim: horarioFim,
        responsavel_id: responsavelId,
        responsavel_tipo: responsavel.tipo,
        recorrente,
        tipo_recorrencia: recorrente ? tipoRecorrencia : undefined,
        dia_semana: recorrente && tipoRecorrencia !== 'mensal' 
          ? ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][dataSelecionada.getDay()]
          : undefined,
        dia_mes: recorrente && tipoRecorrencia === 'mensal' ? dataSelecionada.getDate() : undefined,
        data_inicio_recorrencia: recorrente && dataInicio ? dataInicio.toISOString().split('T')[0] : undefined,
        data_fim_recorrencia: recorrente && dataFim ? dataFim.toISOString().split('T')[0] : undefined,
        unit_id: finalUnitId,
      });
      
      console.log('✅ Reserva criada com sucesso!');
      onClose();
    } catch (error) {
      console.error('❌ Erro ao criar reserva:', error);
    }
  };

  const renderEtapa = () => {
    switch (etapa) {
      case 1:
        const horarioFunc = dataSelecionada ? obterHorarioFuncionamento(dataSelecionada) : null;
        
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Etapa 1: Selecionar Data */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                <h3 className="text-lg font-medium">1. Selecione a Data</h3>
              </div>
              <Calendar
                mode="single"
                selected={dataSelecionada || undefined}
                onSelect={(date) => setDataSelecionada(date || null)}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                locale={ptBR}
                className="rounded-md border"
              />
            </div>

            <div className="space-y-6">
              {/* Etapa 2: Selecionar Horário de Início */}
              {dataSelecionada && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <h3 className="text-lg font-medium">2. Selecione o Horário de Início</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {dataSelecionada.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                  </p>
                  
                  {horarioFunc && (
                    <div className="text-sm p-3 bg-muted rounded-md">
                      <p className="font-medium">Horário de funcionamento:</p>
                      <p>{horarioFunc.aberto ? `${horarioFunc.inicio} - ${horarioFunc.fim}` : 'Fechado'}</p>
                    </div>
                  )}
                  
                  {loadingHorarios ? (
                    <p>Carregando horários...</p>
                  ) : !horarioFunc?.aberto ? (
                    <p className="text-center text-muted-foreground py-8">
                      Salas fechadas neste dia
                    </p>
                  ) : horariosInicio.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum horário disponível
                    </p>
                  ) : (
                    <Select value={horarioInicioSelecionado || ""} onValueChange={setHorarioInicioSelecionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o horário" />
                      </SelectTrigger>
                      <SelectContent className="z-50">
                        {horariosInicio.map((horario) => (
                          <SelectItem key={horario.horario_inicio} value={horario.horario_inicio}>
                            {horario.horario_inicio} ({horario.salas_disponiveis} sala{horario.salas_disponiveis > 1 ? 's' : ''})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Etapa 3: Selecionar Duração */}
              {horarioInicioSelecionado && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <h3 className="text-lg font-medium">3. Selecione a Duração</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Início: {horarioInicioSelecionado}
                  </p>
                  
                  <Select 
                    value={duracaoSelecionada?.toString() || ""} 
                    onValueChange={(value) => setDuracaoSelecionada(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a duração" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      {OPCOES_DURACAO.map((opcao) => {
                        const horarioFim = calcularHorarioFim(horarioInicioSelecionado, opcao.valor);
                        const estaNoFuncionamento = horarioFunc ? 
                          horarioEstaNoFuncionamento(horarioInicioSelecionado, horarioFim, horarioFunc) : false;
                        
                        return (
                          <SelectItem 
                            key={opcao.valor} 
                            value={opcao.valor.toString()}
                            disabled={!estaNoFuncionamento}
                          >
                            {opcao.label} - até {horarioFim}
                            {!estaNoFuncionamento && ' (fora do horário)'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {duracaoSelecionada && (
                    <Button 
                      onClick={() => setEtapa(2)}
                      className="w-full"
                    >
                      Próximo: Selecionar Sala
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Etapa 4: Selecionar Sala */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <h3 className="text-lg font-medium">4. Selecione a Sala</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {dataSelecionada?.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                {' • '}
                {horarioInicioSelecionado} - {duracaoSelecionada && calcularHorarioFim(horarioInicioSelecionado!, duracaoSelecionada)}
              </p>
              
              {salasDisponiveisParaDuracao.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma sala disponível para este horário e duração
                </p>
              ) : (
                <div className="grid gap-3 max-h-64 overflow-y-auto">
                  {salasDisponiveisParaDuracao.map((sala) => (
                    <Button
                      key={sala.id}
                      variant={salaSelecionada === sala.id ? "default" : "outline"}
                      className="h-auto p-4 justify-start"
                      style={salaSelecionada === sala.id ? {} : { borderColor: sala.cor_calendario }}
                      onClick={() => setSalaSelecionada(sala.id)}
                    >
                      <div
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: sala.cor_calendario }}
                      />
                      <div className="text-left">
                        <p className="font-medium">{sala.nome}</p>
                        <p className="text-sm opacity-70">
                          Capacidade: {sala.capacidade} pessoas
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Etapa 5: Detalhes do Evento */}
            {salaSelecionada && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <h3 className="text-lg font-medium">5. Detalhes do Evento</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label>Tipo de Evento</Label>
                    <Select value={tipoEvento} onValueChange={setTipoEvento}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_EVENTO.map((tipo) => (
                          <SelectItem key={tipo.valor} value={tipo.valor}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Título</Label>
                    <Input 
                      value={titulo} 
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ex: Reunião pedagógica"
                    />
                  </div>

                  <div>
                    <Label>Descrição (opcional)</Label>
                    <Textarea 
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Detalhes do evento..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Responsável</Label>
                    <Select value={responsavelId} onValueChange={setResponsavelId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {responsaveis.map((resp) => (
                          <SelectItem key={resp.id} value={resp.id}>
                            {resp.nome} ({resp.tipo})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="recorrente" 
                      checked={recorrente}
                      onCheckedChange={(checked) => setRecorrente(checked as boolean)}
                    />
                    <Label htmlFor="recorrente">Evento Recorrente</Label>
                  </div>

                  {recorrente && (
                    <div className="space-y-3 ml-6 p-3 border rounded-md">
                      <div>
                        <Label>Tipo de Recorrência</Label>
                        <Select value={tipoRecorrencia} onValueChange={setTipoRecorrencia}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="semanal">Semanal</SelectItem>
                            <SelectItem value="quinzenal">Quinzenal</SelectItem>
                            <SelectItem value="mensal">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Data de Início</Label>
                        <Calendar
                          mode="single"
                          selected={dataInicio || undefined}
                          onSelect={(date) => setDataInicio(date || null)}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          locale={ptBR}
                          className="rounded-md border"
                        />
                      </div>
                      
                      <div>
                        <Label>Data de Término (opcional)</Label>
                        <Calendar
                          mode="single"
                          selected={dataFim || undefined}
                          onSelect={(date) => setDataFim(date || null)}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          locale={ptBR}
                          className="rounded-md border"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => setEtapa(1)}
                      className="flex-1"
                    >
                      Voltar
                    </Button>
                    <Button 
                      onClick={handleSubmit}
                      disabled={!tipoEvento || !titulo || !responsavelId || criarEventoMutation.isPending}
                      className="flex-1"
                    >
                      {criarEventoMutation.isPending ? 'Criando...' : 'Criar Reserva'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {etapa === 1 ? 'Reservar Sala - Selecione Data, Horário e Duração' : 'Reservar Sala - Selecione a Sala e Detalhes'}
          </DialogTitle>
        </DialogHeader>

        {renderEtapa()}
      </DialogContent>
    </Dialog>
  );
};
