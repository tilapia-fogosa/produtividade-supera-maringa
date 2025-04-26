
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
import { X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
    tags?: string[];
    column_id?: string;
  };
  onSave: (values: {
    title: string;
    description: string;
    responsavel: string;
    priority?: string;
    due_date?: string | null;
    tags?: string[];
    column_id?: string;
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

const tagSuggestions = [
  'Urgente', 'Em Andamento', 'Aguardando Retorno', 'Requer Atenção',
  'Família', 'Financeiro', 'Pedagógico', 'Comportamental'
];

export function EditKanbanCardModal({ isOpen, onClose, card, onSave }: EditKanbanCardModalProps) {
  const [values, setValues] = useState({
    title: card.title,
    description: card.description || "",
    responsavel: card.responsavel || "",
    priority: card.priority || "medium",
    due_date: card.due_date ? new Date(card.due_date) : null,
    tags: card.tags || [],
    column_id: card.column_id || "todo"
  });

  const [newTag, setNewTag] = useState("");

  const handleSave = () => {
    // Converte a data para string ISO antes de salvar
    onSave({
      ...values,
      due_date: values.due_date ? values.due_date.toISOString() : null
    });
    onClose();
  };

  const addTag = (tag: string) => {
    if (tag && !values.tags.includes(tag)) {
      setValues({ ...values, tags: [...values.tags, tag] });
    }
    setNewTag("");
  };

  const removeTag = (tagToRemove: string) => {
    setValues({
      ...values,
      tags: values.tags.filter(tag => tag !== tagToRemove)
    });
  };

  return (
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
              onChange={(e) => setValues({ ...values, description: e.target.value })}
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
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {values.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Nova tag"
                onKeyPress={(e) => e.key === 'Enter' && addTag(newTag)}
              />
              <Button onClick={() => addTag(newTag)}>
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {tagSuggestions
                .filter(tag => !values.tags.includes(tag))
                .map(tag => (
                  <Badge 
                    key={tag}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => addTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
            </div>
          </div>

          {card.historico && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Histórico</label>
              <div className="bg-gray-50 p-3 rounded-md text-sm whitespace-pre-line">
                {card.historico}
              </div>
            </div>
          )}

          <Button
            onClick={handleSave}
            className="w-full bg-orange-500 text-white hover:bg-orange-600"
          >
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
