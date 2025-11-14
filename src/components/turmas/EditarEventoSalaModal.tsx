import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useEditarEventoSala } from "@/hooks/use-editar-evento-sala";
import { Loader2 } from "lucide-react";

interface EditarEventoSalaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventoId: string;
}

export function EditarEventoSalaModal({
  open,
  onOpenChange,
  eventoId,
}: EditarEventoSalaModalProps) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(true);

  const { mutate: editarEvento, isPending } = useEditarEventoSala();

  useEffect(() => {
    if (open && eventoId) {
      loadEventoData();
    }
  }, [open, eventoId]);

  const loadEventoData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("eventos_sala")
        .select("titulo, descricao")
        .eq("id", eventoId)
        .single();

      if (error) throw error;

      if (data) {
        setTitulo(data.titulo);
        setDescricao(data.descricao || "");
      }
    } catch (error) {
      console.error("Erro ao carregar evento:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    editarEvento(
      {
        id: eventoId,
        titulo,
        descricao: descricao || null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Reserva</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Reunião de pais"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Observações adicionais (opcional)"
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
