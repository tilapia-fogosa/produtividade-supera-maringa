import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useProfessores } from "@/hooks/use-professores";
import { useCriarEventoProfessor } from "@/hooks/use-criar-evento-professor";
import { useCurrentFuncionario } from "@/hooks/use-current-funcionario";
import { useTurmas } from "@/hooks/use-turmas";
import { TIPOS_EVENTO, OPCOES_DURACAO, obterHorarioFuncionamento, calcularHorarioFim, horarioEstaNoFuncionamento } from "@/constants/horariosFuncionamento";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface BloquearHorarioProfessorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BloquearHorarioProfessorModal({ open, onOpenChange }: BloquearHorarioProfessorModalProps) {
  const { professores } = useProfessores();
  const criarEvento = useCriarEventoProfessor();
  const { funcionarioId } = useCurrentFuncionario();
  const { data: turmas } = useTurmas();

  const [etapa, setEtapa] = useState(1);
  const [professoresIds, setProfessoresIds] = useState<string[]>([]);
  const [tipoBloqueio, setTipoBloqueio] = useState<"pontual" | "periodico" | "">("");
  const [dataSelecionada, setDataSelecionada] = useState<Date>();
  const [diaSemana, setDiaSemana] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("");
  const [duracao, setDuracao] = useState(60);
  const [tipoEvento, setTipoEvento] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [dataInicioRecorrencia, setDataInicioRecorrencia] = useState<Date>();
  const [dataFimRecorrencia, setDataFimRecorrencia] = useState<Date>();

  const diasSemana = [
    { valor: "segunda", label: "Segunda-feira" },
    { valor: "terca", label: "Terça-feira" },
    { valor: "quarta", label: "Quarta-feira" },
    { valor: "quinta", label: "Quinta-feira" },
    { valor: "sexta", label: "Sexta-feira" },
    { valor: "sabado", label: "Sábado" },
  ];

  const resetForm = () => {
    setEtapa(1);
    setProfessoresIds([]);
    setTipoBloqueio("");
    setDataSelecionada(undefined);
    setDiaSemana("");
    setHorarioInicio("");
    setDuracao(60);
    setTipoEvento("");
    setTurmaId("");
    setTitulo("");
    setDataInicioRecorrencia(undefined);
    setDataFimRecorrencia(undefined);
  };

  const handleProximo = () => {
    setEtapa(etapa + 1);
  };

  const handleVoltar = () => {
    setEtapa(etapa - 1);
  };

  const handleSalvar = async () => {
    let tituloFinal = titulo;
    if (tipoEvento === 'apoio_turma' && turmaId) {
      const turma = turmas?.find(t => t.id === turmaId);
      if (turma) {
        tituloFinal = `${titulo} - ${turma.nome}`;
      }
    }

    console.log("Salvando bloqueio para professores:", professoresIds, {
      tipoEvento,
      titulo: tituloFinal,
      horarioInicio,
      duracao,
      tipoBloqueio
    });

    try {
      // Criar evento para cada professor selecionado (sem vinculação a unidade)
      const criacaoPromises = professoresIds.map(professorId =>
        criarEvento.mutateAsync({
          professorId,
          tipoEvento,
          titulo: tituloFinal,
          data: tipoBloqueio === "pontual" ? dataSelecionada : undefined,
          horarioInicio,
          duracaoMinutos: duracao,
          recorrente: tipoBloqueio === "periodico",
          tipoRecorrencia: tipoBloqueio === "periodico" ? "semanal" : undefined,
          diaSemana: tipoBloqueio === "periodico" ? diaSemana : undefined,
          dataInicioRecorrencia,
          dataFimRecorrencia,
          funcionario_registro_id: funcionarioId || undefined,
        })
      );

      await Promise.all(criacaoPromises);

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao criar bloqueio de horário:", error);
    }
  };

  // Gerar horários disponíveis
  const gerarHorariosDisponiveis = () => {
    if (tipoBloqueio === "pontual" && !dataSelecionada) return [];
    if (tipoBloqueio === "periodico" && !diaSemana) return [];

    const dataRef = tipoBloqueio === "pontual" ? dataSelecionada! : new Date();
    const horarioFuncionamento = tipoBloqueio === "periodico"
      ? obterHorarioFuncionamento(new Date(2025, 0, diasSemana.findIndex(d => d.valor === diaSemana) + 5))
      : obterHorarioFuncionamento(dataRef);

    if (!horarioFuncionamento.aberto) return [];

    const horarios: string[] = [];
    const [horaInicio, minInicio] = horarioFuncionamento.inicio.split(':').map(Number);
    const [horaFim, minFim] = horarioFuncionamento.fim.split(':').map(Number);

    let minutos = horaInicio * 60 + minInicio;
    const minutosFim = horaFim * 60 + minFim;

    while (minutos < minutosFim) {
      const h = Math.floor(minutos / 60);
      const m = minutos % 60;
      const horario = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      horarios.push(horario);
      minutos += 30;
    }

    return horarios;
  };

  const horariosDisponiveis = gerarHorariosDisponiveis();

  // Filtrar durações válidas
  const duracoesFiltradas = OPCOES_DURACAO.filter(opcao => {
    if (!horarioInicio) return true;

    const dataRef = tipoBloqueio === "pontual" && dataSelecionada ? dataSelecionada : new Date();
    const horarioFim = calcularHorarioFim(horarioInicio, opcao.valor);
    const horarioFuncionamento = tipoBloqueio === "periodico"
      ? obterHorarioFuncionamento(new Date(2025, 0, diasSemana.findIndex(d => d.valor === diaSemana) + 5))
      : obterHorarioFuncionamento(dataRef);

    return horarioEstaNoFuncionamento(horarioInicio, horarioFim, horarioFuncionamento);
  });

  const professoresSelecionados = professores.filter(p => professoresIds.includes(p.id));

  const toggleProfessor = (professorId: string) => {
    setProfessoresIds(prev =>
      prev.includes(professorId)
        ? prev.filter(id => id !== professorId)
        : [...prev, professorId]
    );
  };

  const selecionarTodos = () => {
    setProfessoresIds(professores.map(p => p.id));
  };

  const desmarcarTodos = () => {
    setProfessoresIds([]);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bloquear Horário - Etapa {etapa}/2</DialogTitle>
          <DialogDescription>
            Configure o bloqueio de horário para um ou mais professores
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Etapa 1: Selecionar Professores e Tipo de Bloqueio */}
          {etapa === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Selecione os Professores</Label>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={selecionarTodos}>
                      Todos
                    </Button>
                    <Button size="sm" variant="outline" onClick={desmarcarTodos}>
                      Nenhum
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                  {professores.map((prof) => (
                    <label key={prof.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded border border-transparent hover:border-border transition-colors">
                      <input
                        type="checkbox"
                        checked={professoresIds.includes(prof.id)}
                        onChange={() => toggleProfessor(prof.id)}
                        className="cursor-pointer"
                      />
                      <span className="text-sm truncate">{prof.nome}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Bloqueio</Label>
                <div className="w-full md:w-[350px]">
                  <Select value={tipoBloqueio} onValueChange={(val: "pontual" | "periodico") => setTipoBloqueio(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de bloqueio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pontual">Pontual (Data específica)</SelectItem>
                      <SelectItem value="periodico">Periódico (Recorrente toda semana)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleProximo} disabled={professoresIds.length === 0 || !tipoBloqueio}>
                  Próximo <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Etapa 2: Data/Horário + Tipo de Evento (layout lado a lado) */}
          {etapa === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coluna Esquerda: Data/Dia, Horário e Duração */}
                <div className="space-y-4">
                  {tipoBloqueio === "pontual" ? (
                    <div className="space-y-2">
                      <Label>Selecione a Data</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !dataSelecionada && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dataSelecionada ? format(dataSelecionada, "PPP", { locale: pt }) : <span>Selecione uma data</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[100]">
                          <Calendar
                            mode="single"
                            selected={dataSelecionada}
                            onSelect={setDataSelecionada}
                            locale={pt}
                            className="rounded-md border pointer-events-auto [&_.rdp-day_selected]:bg-purple-600 [&_.rdp-day_selected]:text-white [&_.rdp-day_selected:hover]:bg-purple-700"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Selecione o Dia da Semana</Label>
                        <Select value={diaSemana} onValueChange={setDiaSemana}>
                          <SelectTrigger>
                            <SelectValue placeholder="Escolha o dia" />
                          </SelectTrigger>
                          <SelectContent>
                            {diasSemana.map((dia) => (
                              <SelectItem key={dia.valor} value={dia.valor}>
                                {dia.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Data Início (opcional)</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal px-2 text-xs",
                                  !dataInicioRecorrencia && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-3 w-3 shrink-0" />
                                {dataInicioRecorrencia ? format(dataInicioRecorrencia, "dd/MM/yyyy", { locale: pt }) : <span>Início</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 z-[100]">
                              <Calendar
                                mode="single"
                                selected={dataInicioRecorrencia}
                                onSelect={setDataInicioRecorrencia}
                                locale={pt}
                                className="rounded-md border pointer-events-auto [&_.rdp-day_selected]:bg-purple-600 [&_.rdp-day_selected]:text-white [&_.rdp-day_selected:hover]:bg-purple-700"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Data Fim (opcional)</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal px-2 text-xs",
                                  !dataFimRecorrencia && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-3 w-3 shrink-0" />
                                {dataFimRecorrencia ? format(dataFimRecorrencia, "dd/MM/yyyy", { locale: pt }) : <span>Fim</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 z-[100]">
                              <Calendar
                                mode="single"
                                selected={dataFimRecorrencia}
                                onSelect={setDataFimRecorrencia}
                                locale={pt}
                                className="rounded-md border pointer-events-auto [&_.rdp-day_selected]:bg-purple-600 [&_.rdp-day_selected]:text-white [&_.rdp-day_selected:hover]:bg-purple-700"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Horário e Duração */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Horário de Início</Label>
                      <Select value={horarioInicio} onValueChange={setHorarioInicio}>
                        <SelectTrigger>
                          <SelectValue placeholder="Horário" />
                        </SelectTrigger>
                        <SelectContent>
                          {horariosDisponiveis.map((horario) => (
                            <SelectItem key={horario} value={horario}>
                              {horario}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Duração</Label>
                      <Select value={String(duracao)} onValueChange={(v) => setDuracao(Number(v))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Duração" />
                        </SelectTrigger>
                        <SelectContent>
                          {duracoesFiltradas.map((opcao) => (
                            <SelectItem key={opcao.valor} value={String(opcao.valor)}>
                              {opcao.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {horarioInicio && (
                    <p className="text-sm text-muted-foreground">
                      Horário completo: {horarioInicio} - {calcularHorarioFim(horarioInicio, duracao)}
                    </p>
                  )}
                </div>

                {/* Coluna Direita: Tipo de Evento, Título e Descrição */}
                <div className="space-y-4">
                  <div className="space-y-2">
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

                  {tipoEvento === 'apoio_turma' && (
                    <div className="space-y-2">
                      <Label>Turma (Apoio)</Label>
                      <Select value={turmaId} onValueChange={setTurmaId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a turma" />
                        </SelectTrigger>
                        <SelectContent>
                          {turmas?.map((turma) => (
                            <SelectItem key={turma.id} value={turma.id}>
                              {turma.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ex: Reunião pedagógica"
                    />
                  </div>
                </div>
              </div>

              {/* Resumo - Full Width */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Resumo</h4>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p><strong>Professores:</strong> {professoresSelecionados.map(p => p.nome).join(', ')}</p>
                  <p><strong>Tipo:</strong> {tipoBloqueio === "pontual" ? "Pontual" : "Periódico"}</p>
                  {tipoBloqueio === "pontual" && dataSelecionada && (
                    <p><strong>Data:</strong> {format(dataSelecionada, "dd/MM/yyyy", { locale: pt })}</p>
                  )}
                  {tipoBloqueio === "periodico" && diaSemana && (
                    <p><strong>Dia:</strong> {diasSemana.find(d => d.valor === diaSemana)?.label}</p>
                  )}
                  {horarioInicio && (
                    <p><strong>Horário:</strong> {horarioInicio} - {calcularHorarioFim(horarioInicio, duracao)}</p>
                  )}
                  {tipoEvento && (
                    <p><strong>Tipo Evento:</strong> {TIPOS_EVENTO.find(t => t.valor === tipoEvento)?.label}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleVoltar}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button
                  onClick={handleSalvar}
                  disabled={
                    (tipoBloqueio === "pontual" ? !dataSelecionada : !diaSemana) ||
                    !horarioInicio ||
                    !tipoEvento ||
                    (tipoEvento === 'apoio_turma' && !turmaId) ||
                    !titulo ||
                    criarEvento.isPending
                  }
                >
                  {criarEvento.isPending ? "Salvando..." : "Salvar Bloqueio"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
