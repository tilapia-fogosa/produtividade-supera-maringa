
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CalendarClock, User, Clock, History, CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EditKanbanCardModal } from "./EditKanbanCardModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HistoricoView } from "./HistoricoView";
import { format } from "date-fns";

interface KanbanCardProps {
  id: string;
  title: string;
  description?: string | null;
  alunoNome?: string | null;
  origem?: string | null;
  responsavel?: string | null;
  createdAt: string;
  priority?: string;
  due_date?: string | null;
  tags?: string[];
  historico?: string | null;
  column_id: string;
  retention_date?: string | null;
  alerta_evasao_id: string;
  resultado?: 'evadiu' | 'retido' | null;
  onEdit: (values: { 
    title: string; 
    description: string; 
    responsavel: string;
    priority?: string;
    due_date?: string | null;
    retention_date?: string | null;
    tags?: string[];
    column_id?: string;
  }) => void;
  onFinalizar?: (params: {
    cardId: string;
    alertaId: string;
    resultado: 'evadiu' | 'retido';
    alunoNome?: string | null;
  }) => void;
}

const priorityColors = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-red-500"
};

export function KanbanCard({ 
  id,
  title, 
  description, 
  alunoNome, 
  origem, 
  responsavel, 
  createdAt,
  priority = 'medium',
  due_date,
  tags = [],
  historico,
  column_id,
  retention_date,
  alerta_evasao_id,
  resultado,
  onEdit,
  onFinalizar
}: KanbanCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);

  const priorityColor = priorityColors[priority as keyof typeof priorityColors] || priorityColors.medium;
  
  const handleCardClick = () => {
    if (!resultado) {  // Só permite editar se não estiver finalizado
      setIsEditModalOpen(true);
    }
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

  return (
    <>
      <Card 
        className={`p-3 mb-2 bg-white shadow-sm hover:shadow-md transition-shadow ${resultado ? 'border-l-4 ' + (resultado === 'evadiu' ? 'border-l-red-500' : 'border-l-green-500') : 'cursor-grab active:cursor-grabbing'} relative`}
        onClick={handleCardClick}
      >
        {resultado && (
          <Badge 
            variant={resultado === 'evadiu' ? 'destructive' : 'success'} 
            className="absolute top-2 right-2"
          >
            {resultado === 'evadiu' ? 'Evadido' : 'Retido'}
          </Badge>
        )}
        
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1 mr-2">{title}</h4>
            <div className={`w-2 h-2 rounded-full ${priorityColor} flex-shrink-0`} />
          </div>
          
          {alunoNome && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <User className="h-3 w-3" />
              <span>{alunoNome}</span>
            </div>
          )}
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          {origem && (
            <div className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700">
              {origem}
            </div>
          )}
          
          {description && (
            <p className="text-xs text-gray-600 line-clamp-2">{description}</p>
          )}
          
          {retention_date && (
            <div className="flex items-center gap-1 text-xs text-orange-600">
              <CalendarClock className="h-3 w-3" />
              <span>Retenção: {format(new Date(retention_date), "dd/MM/yyyy")}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(createdAt), { locale: ptBR, addSuffix: true })}</span>
              </div>
              {due_date && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(due_date), { locale: ptBR, addSuffix: true })}</span>
                </div>
              )}
            </div>
            {historico && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHistorico(true);
                }}
              >
                <History className="h-3 w-3 mr-1" />
                Histórico
              </Button>
            )}
          </div>
          
          <div className="text-xs text-orange-600">
            {responsavel}
          </div>
          
          {!resultado && column_id !== 'hibernating' && onFinalizar && (
            <div className="flex justify-between gap-2 pt-2">
              <Button
                size="sm"
                variant="destructive"
                className="w-1/2 bg-red-500 text-white hover:bg-red-600"
                onClick={(e) => handleFinalizar('evadiu', e)}
              >
                <XCircle className="h-4 w-4 mr-1" /> Evadiu
              </Button>
              
              <Button
                size="sm" 
                className="w-1/2 bg-green-500 text-white hover:bg-green-600"
                onClick={(e) => handleFinalizar('retido', e)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" /> Retido
              </Button>
            </div>
          )}
        </div>
      </Card>

      <EditKanbanCardModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        card={{ 
          id, 
          title, 
          description, 
          responsavel, 
          priority,
          due_date,
          retention_date,
          tags,
          historico,
          column_id
        }}
        onSave={onEdit}
      />

      {showHistorico && historico && (
        <HistoricoView 
          historico={historico} 
          onVoltar={() => setShowHistorico(false)} 
        />
      )}
    </>
  );
}
