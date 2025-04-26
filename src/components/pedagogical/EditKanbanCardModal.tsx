
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface EditKanbanCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: {
    id: string;
    title: string;
    description: string | null;
    responsavel: string | null;
  };
  onSave: (values: {
    title: string;
    description: string;
    responsavel: string;
  }) => void;
}

export function EditKanbanCardModal({ isOpen, onClose, card, onSave }: EditKanbanCardModalProps) {
  const [values, setValues] = useState({
    title: card.title,
    description: card.description || "",
    responsavel: card.responsavel || "",
  });

  const handleSave = () => {
    onSave(values);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
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

          <button
            onClick={handleSave}
            className="w-full bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600 transition-colors"
          >
            Salvar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
