import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { useProfessores } from "@/hooks/use-professores";
import { useCriarEventoProfessor } from "@/hooks/use-criar-evento-professor";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";
import { TIPOS_EVENTO, OPCOES_DURACAO, obterHorarioFuncionamento, calcularHorarioFim, horarioEstaNoFuncionamento } from "@/constants/horariosFuncionamento";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface BloquearHorarioProfessorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BloquearHorarioProfessorModal({ open, onOpenChange }: BloquearHorarioProfessorModalProps) {
  const { activeUnit } = useActiveUnit();
  const { professores, isLoading: loadingProfessores } = useProfessores();
  const criarEvento = useCriarEventoProfessor();

  const [etapa, setEtapa] = useState(1);
  const [professorId, setProfessorId] = useState("");
  const [tipoBloqueio, setTipoBloqueio] = useState<"pontual" | "periodico">("pontual");
  const [dataSelecionada, setDataSelecionada] = useState<Date>();
  const [diaSemana, setDiaSemana] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("");
  const [duracao, setDuracao] = useState(60);
  const [tipoEvento, setTipoEvento] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
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
    setProfessorId("");
    setTipoBloqueio("pontual");
    setDataSelecionada(undefined);
    setDiaSemana("");
    setHorarioInicio("");
    setDuracao(60);
    setTipoEvento("");
    setTitulo("");
    setDescricao("");
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
    if (!activeUnit?.id) return;

    await criarEvento.mutateAsync({
      professorId,
      tipoEvento,
      titulo,
      descricao,
      data: tipoBloqueio === "pontual" ? dataSelecionada : undefined,
      horarioInicio,
      duracaoMinutos: duracao,
      recorrente: tipoBloqueio === "periodico",
      tipoRecorrencia: tipoBloqueio === "periodico" ? "semanal" : undefined,
      diaSemana: tipoBloqueio === "periodico" ? diaSemana : undefined,
      dataInicioRecorrencia,
      dataFimRecorrencia,
      unitId: activeUnit.id,
    });

    resetForm();
    onOpenChange(false);
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

  const professorSelecionado = professores.find(p => p.id === professorId);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bloquear Horário - Etapa {etapa}/6</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Etapa 1: Selecionar Professor */}
          {etapa === 1 && (
            <div className="space-y-4">
              <Label>Selecione o Professor</Label>
              <Select value={professorId} onValueChange={setProfessorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um professor" />
                </SelectTrigger>
                <SelectContent>
                  {professores.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-end">
                <Button onClick={handleProximo} disabled={!professorId}>
                  Próximo <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Etapa 2: Tipo de Bloqueio */}
          {etapa === 2 && (
            <div className="space-y-4">
              <Label>Tipo de Bloqueio</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={tipoBloqueio === "pontual" ? "default" : "outline"}
                  onClick={() => setTipoBloqueio("pontual")}
                  className="h-20"
                >
                  Pontual
                  <span className="text-xs block mt-1">Data específica</span>
                </Button>
                <Button
                  variant={tipoBloqueio === "periodico" ? "default" : "outline"}
                  onClick={() => setTipoBloqueio("periodico")}
                  className="h-20"
                >
                  Periódico
                  <span className="text-xs block mt-1">Recorrência semanal</span>
                </Button>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleVoltar}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button onClick={handleProximo}>
                  Próximo <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Etapa 3: Selecionar Data ou Dia da Semana */}
          {etapa === 3 && (
            <div className="space-y-4">
              {tipoBloqueio === "pontual" ? (
                <>
                  <Label>Selecione a Data</Label>
                  <Calendar
                    mode="single"
                    selected={dataSelecionada}
                    onSelect={setDataSelecionada}
                    locale={pt}
                    className="rounded-md border"
                  />
                </>
              ) : (
                <>
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

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label>Data Início (opcional)</Label>
                      <Calendar
                        mode="single"
                        selected={dataInicioRecorrencia}
                        onSelect={setDataInicioRecorrencia}
                        locale={pt}
                        className="rounded-md border"
                      />
                    </div>
                    <div>
                      <Label>Data Fim (opcional)</Label>
                      <Calendar
                        mode="single"
                        selected={dataFimRecorrencia}
                        onSelect={setDataFimRecorrencia}
                        locale={pt}
                        className="rounded-md border"
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleVoltar}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button 
                  onClick={handleProximo} 
                  disabled={tipoBloqueio === "pontual" ? !dataSelecionada : !diaSemana}
                >
                  Próximo <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Etapa 4: Selecionar Horário */}
          {etapa === 4 && (
            <div className="space-y-4">
              <div>
                <Label>Horário de Início</Label>
                <Select value={horarioInicio} onValueChange={setHorarioInicio}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o horário" />
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
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleVoltar}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button onClick={handleProximo} disabled={!horarioInicio}>
                  Próximo <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Etapa 5: Selecionar Duração */}
          {etapa === 5 && (
            <div className="space-y-4">
              <Label>Duração do Bloqueio</Label>
              <Select value={String(duracao)} onValueChange={(v) => setDuracao(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a duração" />
                </SelectTrigger>
                <SelectContent>
                  {duracoesFiltradas.map((opcao) => (
                    <SelectItem key={opcao.valor} value={String(opcao.valor)}>
                      {opcao.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {horarioInicio && (
                <p className="text-sm text-muted-foreground">
                  Horário: {horarioInicio} - {calcularHorarioFim(horarioInicio, duracao)}
                </p>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleVoltar}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button onClick={handleProximo}>
                  Próximo <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Etapa 6: Tipo de Evento e Detalhes */}
          {etapa === 6 && (
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
                  placeholder="Detalhes adicionais..."
                  rows={3}
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Resumo</h4>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p><strong>Professor:</strong> {professorSelecionado?.nome}</p>
                  <p><strong>Tipo:</strong> {tipoBloqueio === "pontual" ? "Pontual" : "Periódico"}</p>
                  {tipoBloqueio === "pontual" && dataSelecionada && (
                    <p><strong>Data:</strong> {format(dataSelecionada, "dd/MM/yyyy", { locale: pt })}</p>
                  )}
                  {tipoBloqueio === "periodico" && (
                    <p><strong>Dia:</strong> {diasSemana.find(d => d.valor === diaSemana)?.label}</p>
                  )}
                  <p><strong>Horário:</strong> {horarioInicio} - {calcularHorarioFim(horarioInicio, duracao)}</p>
                  <p><strong>Tipo Evento:</strong> {TIPOS_EVENTO.find(t => t.valor === tipoEvento)?.label}</p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleVoltar}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button 
                  onClick={handleSalvar} 
                  disabled={!tipoEvento || !titulo || criarEvento.isPending}
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
