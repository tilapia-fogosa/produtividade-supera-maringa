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

interface ReservarSalaModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitId?: string | null;
}

type Etapa = 1 | 2 | 3 | 4;

export const ReservarSalaModal: React.FC<ReservarSalaModalProps> = ({
  isOpen,
  onClose,
  unitId,
}) => {
  console.log('🎯 ReservarSalaModal - unitId recebido:', unitId);
  
  const [etapa, setEtapa] = useState<Etapa>(1);
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState<any>(null);
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
    useHorariosDisponiveisSalas(dataSelecionada, unitId);
  
  const { data: todasSalas } = useSalas(unitId);
  const { responsaveis } = useResponsaveis();
  const criarEventoMutation = useCriarEventoSala();

  const salasDisponiveisNoHorario = todasSalas?.filter(sala => 
    horarioSelecionado?.salas_livres_ids?.includes(sala.id)
  );

  const handleVoltar = () => {
    if (etapa > 1) setEtapa((prev) => (prev - 1) as Etapa);
  };

  const handleSubmit = async () => {
    if (!dataSelecionada || !salaSelecionada || !horarioSelecionado) return;

    const responsavel = responsaveis.find(r => r.id === responsavelId);
    if (!responsavel) return;

    try {
      await criarEventoMutation.mutateAsync({
        sala_id: salaSelecionada,
        tipo_evento: tipoEvento,
        titulo,
        descricao,
        data: dataSelecionada.toISOString().split('T')[0],
        horario_inicio: horarioSelecionado.horario_inicio,
        horario_fim: horarioSelecionado.horario_fim,
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
        unit_id: unitId || undefined,
      });
      
      onClose();
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
    }
  };

  const renderEtapa = () => {
    switch (etapa) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="h-5 w-5" />
              <h3 className="text-lg font-medium">Selecione a Data</h3>
            </div>
            <Calendar
              mode="single"
              selected={dataSelecionada || undefined}
              onSelect={(date) => {
                setDataSelecionada(date || null);
                if (date) setEtapa(2);
              }}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              locale={ptBR}
              className="rounded-md border"
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5" />
              <h3 className="text-lg font-medium">Horários Disponíveis</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {dataSelecionada?.toLocaleDateString('pt-BR')}
            </p>
            
            {loadingHorarios ? (
              <p>Carregando horários...</p>
            ) : (
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                <p className="text-xs text-muted-foreground mb-2">
                  Total de salas ativas: {todasSalas?.length || 0} | 
                  Horários disponíveis: {horariosDisponiveis?.length || 0}
                </p>
                {horariosDisponiveis?.map((horario) => (
                  <Button
                    key={`${horario.horario_inicio}-${horario.horario_fim}`}
                    variant="outline"
                    className="justify-between"
                    onClick={() => {
                      setHorarioSelecionado(horario);
                      if (horario.total_salas_livres === 1) {
                        setSalaSelecionada(horario.salas_livres_ids[0]);
                        setEtapa(4);
                      } else {
                        setEtapa(3);
                      }
                    }}
                  >
                    <span>{horario.horario_inicio} - {horario.horario_fim}</span>
                    <span className="text-sm text-muted-foreground">
                      {horario.total_salas_livres} sala{horario.total_salas_livres > 1 ? 's' : ''} livre{horario.total_salas_livres > 1 ? 's' : ''}
                    </span>
                  </Button>
                ))}
                {horariosDisponiveis?.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum horário disponível para esta data
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5" />
              <h3 className="text-lg font-medium">Selecione a Sala</h3>
            </div>
            <div className="grid gap-3">
              {salasDisponiveisNoHorario?.map((sala) => (
                <Button
                  key={sala.id}
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  style={{ borderColor: sala.cor_calendario }}
                  onClick={() => {
                    setSalaSelecionada(sala.id);
                    setEtapa(4);
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: sala.cor_calendario }}
                  />
                  <div className="text-left">
                    <p className="font-medium">{sala.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      Capacidade: {sala.capacidade} pessoas
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5" />
              <h3 className="text-lg font-medium">Detalhes do Evento</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Tipo de Evento</Label>
                <Select value={tipoEvento} onValueChange={setTipoEvento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="reuniao">Reunião</SelectItem>
                    <SelectItem value="evento_especial">Evento Especial</SelectItem>
                    <SelectItem value="reserva_administrativa">Reserva Administrativa</SelectItem>
                    <SelectItem value="bloqueio_temporario">Bloqueio Temporário</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="treinamento">Treinamento</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
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

              <Button 
                onClick={handleSubmit}
                disabled={!tipoEvento || !titulo || !responsavelId || criarEventoMutation.isPending}
                className="w-full"
              >
                {criarEventoMutation.isPending ? 'Criando...' : 'Criar Reserva'}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {etapa > 1 && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleVoltar}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle>Reservar Sala - Etapa {etapa}/4</DialogTitle>
          </div>
        </DialogHeader>

        {renderEtapa()}
      </DialogContent>
    </Dialog>
  );
};
