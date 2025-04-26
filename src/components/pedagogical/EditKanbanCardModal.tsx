
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, MessageCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { HistoricoModal } from "./HistoricoModal";

interface EditKanbanCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: {
    id: string;
    title: string;
    description: string | null;
    responsavel: string | null;
    historico?: string | null;
    priority?: string;
    due_date?: string | null;
    retention_date?: string | null;
    tags?: string[];
    column_id?: string;
  };
  onSave: (values: {
    title: string;
    description: string;
    responsavel: string;
    priority?: string;
    due_date?: string | null;
    retention_date?: string | null;
    tags?: string[];
    column_id?: string;
    historico?: string | null;
  }) => void;
}

const priorityOptions = [
  { value: 'low', label: 'Baixa', color: 'bg-green-500' },
  { value: 'medium', label: 'Média', color: 'bg-yellow-500' },
  { value: 'high', label: 'Alta', color: 'bg-red-500' }
];

const columnOptions = [
  { value: 'todo', label: 'Alerta criado' },
  { value: 'doing', label: 'Em negociação' },
  { value: 'scheduled', label: 'Retenção agendada' },
  { value: 'done', label: 'Concluída' }
];

export function EditKanbanCardModal({ isOpen, onClose, card, onSave }: EditKanbanCardModalProps) {
  const [values, setValues] = useState({
    title: card.title,
    description: card.description || "",
    responsavel: card.responsavel || "",
    priority: card.priority || "medium",
    due_date: card.due_date ? new Date(card.due_date) : null,
    retention_date: card.retention_date ? new Date(card.retention_date) : null,
    column_id: card.column_id || "todo"
  });

  const [showHistoricoModal, setShowHistoricoModal] = useState(false);

  const handleAddComment = (comment: string) => {
    const timestamp = format(new Date(), "dd/MM/yyyy HH:mm");
    const newHistorico = `${timestamp} - Comentário: ${comment}\n\n${card.historico || ""}`;
    
    onSave({
      ...values,
      description: values.description,
      historico: newHistorico,
      due_date: values.due_date ? values.due_date.toISOString() : null,
      retention_date: values.retention_date ? values.retention_date.toISOString() : null
    });
  };

  const handleSave = () => {
    onSave({
      ...values,
      due_date: values.due_date ? values.due_date.toISOString() : null,
      retention_date: values.retention_date ? values.retention_date.toISOString() : null
    });
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Card</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                value={values.title}
                onChange={(e) => setValues({ ...values, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={values.description}
                readOnly
                className="bg-gray-50"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Responsável</label>
              <Input
                value={values.responsavel}
                onChange={(e) => setValues({ ...values, responsavel: e.target.value })}
              />
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowHistoricoModal(true)}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Ver Histórico e Adicionar Comentários
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Prioridade</label>
                <Select 
                  value={values.priority} 
                  onValueChange={(value) => setValues({ ...values, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${option.color}`} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select 
                  value={values.column_id} 
                  onValueChange={(value) => setValues({ ...values, column_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {columnOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Limite</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {values.due_date ? (
                      format(values.due_date, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={values.due_date || undefined}
                    onSelect={(date) => setValues({ ...values, due_date: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Retenção</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {values.retention_date ? (
                      format(values.retention_date, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data de retenção</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={values.retention_date || undefined}
                    onSelect={(date) => setValues({ ...values, retention_date: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button
              onClick={handleSave}
              className="w-full bg-orange-500 text-white hover:bg-orange-600"
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <HistoricoModal
        isOpen={showHistoricoModal}
        onClose={() => setShowHistoricoModal(false)}
        historico={card.historico || null}
        onAddComment={handleAddComment}
      />
    </>
  );
}
