
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CalendarClock, User, Clock, History, CheckCircle2, XCircle, School, UserCheck, AlertOctagon, Calendar, FileWarning, MessageCircle } from "lucide-react";
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EditKanbanCardModal } from "./EditKanbanCardModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HistoricoView } from "./HistoricoView";
import { Checkbox } from "@/components/ui/checkbox";
import { HistoricoModal } from "./HistoricoModal";
interface KanbanCardProps {
  id: string;
  title: string;
  description?: string | null;
  alunoNome?: string | null;
  origem?: string | null;
  responsavel?: string | null;
  createdAt: string;
  due_date?: string | null;
  tags?: string[];
  historico?: string | null;
  column_id: string;
  retention_date?: string | null;
  alerta_evasao_id: string;
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
  onEdit: (values: {
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
  onFinalizar?: (params: {
    cardId: string;
    alertaId: string;
    resultado: 'evadiu' | 'retido';
    alunoNome?: string | null;
  }) => void;
  onUpdateStatus?: (cardId: string, field: string, value: boolean | string | null) => void;
  onAddComment?: (cardId: string, comment: string) => void;
}
export function KanbanCard({
  id,
  title,
  description,
  alunoNome,
  origem,
  responsavel,
  createdAt,
  due_date,
  tags = [],
  historico,
  column_id,
  retention_date,
  alerta_evasao_id,
  resultado,
  // Campos comuns
  turma,
  educador,
  fez_pausa_emergencial = false,
  faltas_recorrentes = false,
  // Campos específicos para alertas ativos
  link_ficha_rescisao,
  // Campos específicos para Evadidos
  data_evasao,
  data_rescisao,
  data_exclusao_sgs,
  motivo_evasao,
  exclusao_sgs_confirmada = false,
  exclusao_whatsapp_confirmada = false,
  // Campos específicos para Retidos
  data_retencao_confirmada,
  acao_retencao,
  acordo_retencao,
  // Observações para retidos e evadidos
  observacoes_adicionais,
  onEdit,
  onFinalizar,
  onUpdateStatus,
  onAddComment
}: KanbanCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  const [isHistoricoModalOpen, setIsHistoricoModalOpen] = useState(false);
  const handleCardClick = () => {
    setIsEditModalOpen(true);
  };
  const handleFinalizar = (tipo: 'evadiu' | 'retido', e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFinalizar) {
      onFinalizar({
        cardId: id,
        alertaId: alerta_evasao_id,
        resultado: tipo,
        alunoNome
      });
    }
  };
  const handleStatusChange = (field: string, value: boolean | string | null) => {
    if (onUpdateStatus) {
      onUpdateStatus(id, field, value);
    }
  };
  const handleAddComment = (comment: string) => {
    if (onAddComment) {
      onAddComment(id, comment);
      setIsHistoricoModalOpen(false);
    }
  };

  // Determinar que tipo de card estamos exibindo
  const isAtivoCard = !resultado;
  const isEvadidoCard = resultado === 'evadiu';
  const isRetidoCard = resultado === 'retido';

  // Formatar datas para exibição
  const formattedDataEvasao = data_evasao ? format(new Date(data_evasao), "MM/yyyy") : null;
  const formattedDataRescisao = data_rescisao ? format(new Date(data_rescisao), "dd/MM/yyyy") : null;
  const formattedDataExclusaoSGS = data_exclusao_sgs ? format(new Date(data_exclusao_sgs), "dd/MM/yyyy") : null;
  const formattedDataRetencao = data_retencao_confirmada ? format(new Date(data_retencao_confirmada), "dd/MM/yyyy") : null;
  const formattedDataAlerta = createdAt ? format(new Date(createdAt), "dd/MM/yyyy") : null;
  return <>
      <Card className={`p-3 mb-2 bg-white shadow-sm hover:shadow-md transition-shadow ${resultado ? 'border-l-4 ' + (resultado === 'evadiu' ? 'border-l-red-500' : 'border-l-green-500') : ''} relative cursor-pointer`} onClick={handleCardClick}>
        {resultado && <Badge variant={resultado === 'evadiu' ? 'destructive' : 'success'} className="absolute top-2 right-2">
            {resultado === 'evadiu' ? 'Evadido' : 'Retido'}
          </Badge>}
        
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{alunoNome || title}</h4>
          </div>
          
          {/* Informações Comuns para Todos os Cards */}
          {turma && <div className="flex items-center gap-1 text-xs text-gray-600">
              <School className="h-3 w-3" />
              <span>Turma: {turma}</span>
            </div>}
          
          {educador && <div className="flex items-center gap-1 text-xs text-gray-600">
              <UserCheck className="h-3 w-3" />
              <span>Educador: {educador}</span>
            </div>}

          {/* Informações Específicas para Alertas Ativos */}
          {isAtivoCard && <>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Calendar className="h-3 w-3" />
                <span>Data do alerta: {formattedDataAlerta}</span>
              </div>
              
              {link_ficha_rescisao && <div className="flex items-center gap-1 text-xs text-blue-600">
                  <FileWarning className="h-3 w-3" />
                  <a href={link_ficha_rescisao} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                    Ficha de rescisão
                  </a>
                </div>}
            </>}

          {/* Informações Específicas para Evadidos */}
          {isEvadidoCard && <>
              {formattedDataEvasao && <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Calendar className="h-3 w-3" />
                  <span>Mês da evasão: {formattedDataEvasao}</span>
                </div>}
              
              {formattedDataRescisao && <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Calendar className="h-3 w-3" />
                  <span>Data da rescisão: {formattedDataRescisao}</span>
                </div>}
              
              {formattedDataExclusaoSGS && <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Calendar className="h-3 w-3" />
                  <span>Exclusão do SGS: {formattedDataExclusaoSGS}</span>
                </div>}
              
              {motivo_evasao && <div className="flex items-center gap-1 text-xs text-gray-600">
                  <AlertOctagon className="h-3 w-3" />
                  <span>Motivo: {motivo_evasao}</span>
                </div>}
              
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant={fez_pausa_emergencial ? "default" : "outline"} className="text-xs">
                  {fez_pausa_emergencial ? "Fez pausa emergencial" : "Sem pausa emergencial"}
                </Badge>
                
                <Badge variant={faltas_recorrentes ? "destructive" : "outline"} className="text-xs">
                  {faltas_recorrentes ? "Faltas recorrentes" : "Sem faltas recorrentes"}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Checkbox id={`sgs-${id}`} checked={exclusao_sgs_confirmada} onCheckedChange={checked => {
                handleStatusChange('exclusao_sgs_confirmada', checked === true);
              }} onClick={e => e.stopPropagation()} />
                  <label htmlFor={`sgs-${id}`} onClick={e => e.stopPropagation()}>Exclusão SGS</label>
                </div>
                
                <div className="flex items-center gap-1">
                  <Checkbox id={`whatsapp-${id}`} checked={exclusao_whatsapp_confirmada} onCheckedChange={checked => {
                handleStatusChange('exclusao_whatsapp_confirmada', checked === true);
              }} onClick={e => e.stopPropagation()} />
                  <label htmlFor={`whatsapp-${id}`} onClick={e => e.stopPropagation()}>Exclusão WhatsApp</label>
                </div>
              </div>
            </>}

          {/* Informações Específicas para Retidos */}
          {isRetidoCard && <>
              {data_retencao_confirmada && <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Calendar className="h-3 w-3" />
                  <span>Data da retenção: {formattedDataRetencao}</span>
                </div>}
              
              {acao_retencao && <div className="flex items-center gap-1 text-xs text-gray-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Ação: {acao_retencao}</span>
                </div>}
              
              {acordo_retencao && <div className="flex items-center gap-1 text-xs text-gray-600">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Acordo: {acordo_retencao}</span>
                </div>}
              
              <Badge variant={faltas_recorrentes ? "destructive" : "outline"} className="text-xs">
                {faltas_recorrentes ? "Faltas recorrentes" : "Sem faltas recorrentes"}
              </Badge>
            </>}

          {/* Observações para Retidos e Evadidos */}
          {(isEvadidoCard || isRetidoCard) && observacoes_adicionais && <div className="text-xs text-gray-600 line-clamp-2">
              <span className="font-medium">Observações: </span>
              {observacoes_adicionais}
            </div>}
          
          {description && !isEvadidoCard && !isRetidoCard && <p className="text-xs text-gray-600 line-clamp-2">{description}</p>}
          
          {retention_date && !data_retencao_confirmada && <div className="flex items-center gap-1 text-xs text-orange-600">
              <CalendarClock className="h-3 w-3" />
              <span>Retenção: {format(new Date(retention_date), "dd/MM/yyyy")}</span>
            </div>}
          
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
            <div className="flex gap-2">
              {createdAt && !isEvadidoCard && !isRetidoCard && <div className="flex items-center gap-1">
                  <CalendarClock className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(createdAt), {
                  locale: ptBR,
                  addSuffix: true
                })}</span>
                </div>}
              {due_date && !isEvadidoCard && !isRetidoCard && <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(due_date), {
                  locale: ptBR,
                  addSuffix: true
                })}</span>
                </div>}
            </div>
            <div className="flex gap-1">
              {historico && <Button variant="ghost" size="sm" onClick={e => {
              e.stopPropagation();
              setShowHistorico(true);
            }} className="h-6 px-2 bg-violet-300 hover:bg-violet-200 text-gray-950">
                  <History className="h-3 w-3 mr-1" />
                  Ver
                </Button>}
              <Button variant="ghost" size="sm" onClick={e => {
              e.stopPropagation();
              setIsHistoricoModalOpen(true);
            }} className="h-6 px-2 bg-violet-300 hover:bg-violet-200 text-gray-950">
                <MessageCircle className="h-3 w-3 mr-1" />
                Comentar
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-orange-600">
            {responsavel}
          </div>
          
          {!resultado && column_id !== 'hibernating' && onFinalizar && <div className="flex justify-between gap-2 pt-2">
              <Button size="sm" variant="destructive" className="w-1/2 bg-red-500 text-white hover:bg-red-600" onClick={e => handleFinalizar('evadiu', e)}>
                <XCircle className="h-4 w-4 mr-1" /> Evadiu
              </Button>
              
              <Button size="sm" className="w-1/2 bg-green-500 text-white hover:bg-green-600" onClick={e => handleFinalizar('retido', e)}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Retido
              </Button>
            </div>}
        </div>
      </Card>

      <EditKanbanCardModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} card={{
      id,
      title,
      description,
      responsavel,
      due_date,
      retention_date,
      tags,
      historico,
      column_id,
      turma,
      educador,
      fez_pausa_emergencial,
      faltas_recorrentes,
      link_ficha_rescisao,
      data_evasao,
      data_rescisao,
      data_exclusao_sgs,
      motivo_evasao,
      exclusao_sgs_confirmada,
      exclusao_whatsapp_confirmada,
      data_retencao_confirmada,
      acao_retencao,
      acordo_retencao,
      observacoes_adicionais,
      resultado
    }} onSave={onEdit} />

      {showHistorico && historico && <HistoricoView historico={historico} onVoltar={() => setShowHistorico(false)} />}
      
      <HistoricoModal isOpen={isHistoricoModalOpen} onClose={() => setIsHistoricoModalOpen(false)} historico={historico} onAddComment={handleAddComment} />
    </>;
}
