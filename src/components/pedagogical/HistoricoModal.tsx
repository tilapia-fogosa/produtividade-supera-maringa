
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";

interface HistoricoModalProps {
  historico: string | null;
  onAddComment: (comment: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function HistoricoModal({ historico, onAddComment, isOpen, onClose }: HistoricoModalProps) {
  const [newComment, setNewComment] = useState("");

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error("O comentário não pode estar vazio");
      return;
    }

    onAddComment(newComment);
    setNewComment("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico e Comentários</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Novo Comentário</label>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Digite seu comentário..."
              className="min-h-[100px]"
            />
            <Button 
              onClick={handleAddComment}
              className="w-full"
            >
              Adicionar Comentário
            </Button>
          </div>

          {historico && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Histórico</label>
              <div className="bg-gray-50 p-3 rounded-md text-sm whitespace-pre-line">
                {historico}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
