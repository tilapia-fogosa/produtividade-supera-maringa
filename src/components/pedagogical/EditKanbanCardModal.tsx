
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

interface CardData {
  id: string;
  title: string;
  description: string | null;
  responsavel: string | null;
  due_date?: string | null;
  retention_date?: string | null;
  tags?: string[];
  historico?: string | null;
  column_id?: string;
  resultado?: 'evadiu' | 'retido' | null;
  
  // Campos comuns
  turma?: string | null;
  educador?: string | null;
  fez_pausa_emergencial?: boolean;
  faltas_recorrentes?: boolean;
  
  // Campos específicos para alertas ativos
  link_ficha_rescisao?: string | null;
  
  // Campos específicos para Evadidos
  data_evasao?: string | null;
  data_rescisao?: string | null;
  data_exclusao_sgs?: string | null;
  motivo_evasao?: string | null;
  exclusao_sgs_confirmada?: boolean;
  exclusao_whatsapp_confirmada?: boolean;
  
  // Campos específicos para Retidos
  data_retencao_confirmada?: string | null;
  acao_retencao?: string | null;
  acordo_retencao?: string | null;
  
  // Observações para retidos e evadidos
  observacoes_adicionais?: string | null;
}

interface EditKanbanCardModalProps {
  isOpen: boolean;
  card: CardData;
  onClose: () => void;
  onSave: (values: {
    title: string;
    description: string;
    responsavel: string;
    due_date?: string | null;
    retention_date?: string | null;
    tags?: string[];
    column_id?: string;
    turma?: string;
    educador?: string;
    fez_pausa_emergencial?: boolean;
    faltas_recorrentes?: boolean;
    link_ficha_rescisao?: string;
    data_evasao?: string;
    data_rescisao?: string;
    data_exclusao_sgs?: string;
    motivo_evasao?: string;
    exclusao_sgs_confirmada?: boolean;
    exclusao_whatsapp_confirmada?: boolean;
    data_retencao_confirmada?: string;
    acao_retencao?: string;
    acordo_retencao?: string;
    observacoes_adicionais?: string;
  }) => void;
}

const motivos_evasao = [
  "Desinteresse", 
  "Saúde", 
  "Financeiro", 
  "Transferência", 
  "Falecimento", 
  "Outras atividades", 
  "Saúde de familiar", 
  "Não tem horário",
  "Outro"
];

const acoes_retencao = [
  "Ação do Financeiro",
  "Atendimento coordenador",
  "Ação do educador",
  "Mudança de horário",
  "Sem atendimento",
  "Equipe"
];

const acordos_retencao = [
  "Pausa emergencial",
  "Continuidade das aulas",
  "Redução da mensalidade",
  "Bolsista",
  "Atendimento individualizado",
  "Troca de turma/dia/horário",
  "Abono de mensalidade",
  "Adaptação do material didático"
];

export function EditKanbanCardModal({ isOpen, card, onClose, onSave }: EditKanbanCardModalProps) {
  const [title, setTitle] = useState<string>(card.title || "");
  const [description, setDescription] = useState<string>(card.description || "");
  const [responsavel, setResponsavel] = useState<string>(card.responsavel || "");
  const [dueDate, setDueDate] = useState<Date | undefined>(card.due_date ? new Date(card.due_date) : undefined);
  const [retentionDate, setRetentionDate] = useState<Date | undefined>(card.retention_date ? new Date(card.retention_date) : undefined);
  
  // Campos comuns
  const [turma, setTurma] = useState<string>(card.turma || "");
  const [educador, setEducador] = useState<string>(card.educador || "");
  const [fezPausaEmergencial, setFezPausaEmergencial] = useState<boolean>(card.fez_pausa_emergencial || false);
  const [faltasRecorrentes, setFaltasRecorrentes] = useState<boolean>(card.faltas_recorrentes || false);
  
  // Campos específicos para alertas ativos
  const [linkFichaRescisao, setLinkFichaRescisao] = useState<string>(card.link_ficha_rescisao || "");
  
  // Campos específicos para Evadidos
  const [dataEvasao, setDataEvasao] = useState<Date | undefined>(card.data_evasao ? new Date(card.data_evasao) : undefined);
  const [dataRescisao, setDataRescisao] = useState<Date | undefined>(card.data_rescisao ? new Date(card.data_rescisao) : undefined);
  const [dataExclusaoSGS, setDataExclusaoSGS] = useState<Date | undefined>(card.data_exclusao_sgs ? new Date(card.data_exclusao_sgs) : undefined);
  const [motivoEvasao, setMotivoEvasao] = useState<string>(card.motivo_evasao || "");
  const [exclusaoSGSConfirmada, setExclusaoSGSConfirmada] = useState<boolean>(card.exclusao_sgs_confirmada || false);
  const [exclusaoWhatsAppConfirmada, setExclusaoWhatsAppConfirmada] = useState<boolean>(card.exclusao_whatsapp_confirmada || false);
  
  // Campos específicos para Retidos
  const [dataRetencaoConfirmada, setDataRetencaoConfirmada] = useState<Date | undefined>(card.data_retencao_confirmada ? new Date(card.data_retencao_confirmada) : undefined);
  const [acaoRetencao, setAcaoRetencao] = useState<string>(card.acao_retencao || "");
  const [acordoRetencao, setAcordoRetencao] = useState<string>(card.acordo_retencao || "");
  
  // Observações para retidos e evadidos
  const [observacoesAdicionais, setObservacoesAdicionais] = useState<string>(card.observacoes_adicionais || "");

  // Determinar tipo de card
  const isAtivoCard = !card.resultado;
  const isEvadidoCard = card.resultado === 'evadiu';
  const isRetidoCard = card.resultado === 'retido';

  const handleSave = () => {
    onSave({
      title,
      description,
      responsavel,
      due_date: dueDate ? dueDate.toISOString() : null,
      retention_date: retentionDate ? retentionDate.toISOString() : null,
      
      // Campos comuns
      turma,
      educador,
      fez_pausa_emergencial: fezPausaEmergencial,
      faltas_recorrentes: faltasRecorrentes,
      
      // Campos específicos para alertas ativos
      link_ficha_rescisao: linkFichaRescisao,
      
      // Campos específicos para Evadidos
      data_evasao: dataEvasao ? dataEvasao.toISOString() : undefined,
      data_rescisao: dataRescisao ? dataRescisao.toISOString() : undefined,
      data_exclusao_sgs: dataExclusaoSGS ? dataExclusaoSGS.toISOString() : undefined,
      motivo_evasao: motivoEvasao,
      exclusao_sgs_confirmada: exclusaoSGSConfirmada,
      exclusao_whatsapp_confirmada: exclusaoWhatsAppConfirmada,
      
      // Campos específicos para Retidos
      data_retencao_confirmada: dataRetencaoConfirmada ? dataRetencaoConfirmada.toISOString() : undefined,
      acao_retencao: acaoRetencao,
      acordo_retencao: acordoRetencao,
      
      // Observações para retidos e evadidos
      observacoes_adicionais: observacoesAdicionais,
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEvadidoCard ? 'Aluno Evadido' : isRetidoCard ? 'Aluno Retido' : 'Editar Alerta'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Campos comuns a todos os tipos de cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsável</Label>
              <Input id="responsavel" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="turma">Turma</Label>
              <Input id="turma" value={turma} onChange={(e) => setTurma(e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="educador">Educador</Label>
              <Input id="educador" value={educador} onChange={(e) => setEducador(e.target.value)} />
            </div>
          </div>
          
          {/* Campos apenas para cards não finalizados (Alertas Ativos) */}
          {isAtivoCard && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Data limite</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : <span>Selecionar data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="retentionDate">Data de retenção</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !retentionDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {retentionDate ? format(retentionDate, "PPP") : <span>Selecionar data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={retentionDate}
                        onSelect={setRetentionDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="link-ficha">Link para ficha de rescisão</Label>
                <Input 
                  id="link-ficha" 
                  value={linkFichaRescisao} 
                  onChange={(e) => setLinkFichaRescisao(e.target.value)} 
                  placeholder="URL da ficha de rescisão"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="flex items-center gap-8">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="pausa-emergencial" 
                    checked={fezPausaEmergencial}
                    onCheckedChange={(checked) => setFezPausaEmergencial(checked === true)}
                  />
                  <label
                    htmlFor="pausa-emergencial"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Fez pausa emergencial
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="faltas-recorrentes" 
                    checked={faltasRecorrentes}
                    onCheckedChange={(checked) => setFaltasRecorrentes(checked === true)}
                  />
                  <label
                    htmlFor="faltas-recorrentes"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Faltas recorrentes
                  </label>
                </div>
              </div>
            </>
          )}
          
          {/* Campos para Evadidos */}
          {isEvadidoCard && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data-evasao">Mês de evasão</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dataEvasao && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataEvasao ? format(dataEvasao, "MM/yyyy") : <span>Selecionar mês</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dataEvasao}
                        onSelect={setDataEvasao}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="motivo-evasao">Motivo da evasão</Label>
                  <Select value={motivoEvasao} onValueChange={setMotivoEvasao}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {motivos_evasao.map((motivo) => (
                        <SelectItem key={motivo} value={motivo}>{motivo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data-rescisao">Data da rescisão</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dataRescisao && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataRescisao ? format(dataRescisao, "PPP") : <span>Selecionar data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dataRescisao}
                        onSelect={setDataRescisao}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="data-exclusao-sgs">Data exclusão do SGS</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dataExclusaoSGS && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataExclusaoSGS ? format(dataExclusaoSGS, "PPP") : <span>Selecionar data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dataExclusaoSGS}
                        onSelect={setDataExclusaoSGS}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="sgs-confirmado" 
                    checked={exclusaoSGSConfirmada}
                    onCheckedChange={(checked) => setExclusaoSGSConfirmada(checked === true)}
                  />
                  <label
                    htmlFor="sgs-confirmado"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Exclusão SGS confirmada
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="whatsapp-confirmado" 
                    checked={exclusaoWhatsAppConfirmada}
                    onCheckedChange={(checked) => setExclusaoWhatsAppConfirmada(checked === true)}
                  />
                  <label
                    htmlFor="whatsapp-confirmado"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Exclusão WhatsApp confirmada
                  </label>
                </div>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="pausa-emergencial" 
                    checked={fezPausaEmergencial}
                    onCheckedChange={(checked) => setFezPausaEmergencial(checked === true)}
                  />
                  <label
                    htmlFor="pausa-emergencial"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Fez pausa emergencial
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="faltas-recorrentes" 
                    checked={faltasRecorrentes}
                    onCheckedChange={(checked) => setFaltasRecorrentes(checked === true)}
                  />
                  <label
                    htmlFor="faltas-recorrentes"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Faltas recorrentes
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea 
                  id="observacoes" 
                  value={observacoesAdicionais} 
                  onChange={(e) => setObservacoesAdicionais(e.target.value)}
                  placeholder="Observações adicionais"
                  rows={4}
                />
              </div>
            </>
          )}
          
          {/* Campos para Retidos */}
          {isRetidoCard && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data-retencao">Data da retenção</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dataRetencaoConfirmada && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataRetencaoConfirmada ? format(dataRetencaoConfirmada, "PPP") : <span>Selecionar data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dataRetencaoConfirmada}
                        onSelect={setDataRetencaoConfirmada}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="acao-retencao">Ação para retenção</Label>
                  <Select value={acaoRetencao} onValueChange={setAcaoRetencao}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a ação" />
                    </SelectTrigger>
                    <SelectContent>
                      {acoes_retencao.map((acao) => (
                        <SelectItem key={acao} value={acao}>{acao}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="acordo-retencao">Acordo para retenção</Label>
                  <Select value={acordoRetencao} onValueChange={setAcordoRetencao}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o acordo" />
                    </SelectTrigger>
                    <SelectContent>
                      {acordos_retencao.map((acordo) => (
                        <SelectItem key={acordo} value={acordo}>{acordo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="faltas-recorrentes" 
                  checked={faltasRecorrentes}
                  onCheckedChange={(checked) => setFaltasRecorrentes(checked === true)}
                />
                <label
                  htmlFor="faltas-recorrentes"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Faltas recorrentes
                </label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea 
                  id="observacoes" 
                  value={observacoesAdicionais} 
                  onChange={(e) => setObservacoesAdicionais(e.target.value)}
                  placeholder="Observações adicionais"
                  rows={4}
                />
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
