
import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EditRegistroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  formData: {
    presente: boolean;
    apostila: string;
    pagina: string;
    exercicios: string;
    erros: string;
    fez_desafio: boolean;
    comentario: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  alunoNome?: string;
}

const EditRegistroModal: React.FC<EditRegistroModalProps> = ({
  isOpen,
  onClose,
  onSave,
  formData,
  handleInputChange,
  handleTextareaChange,
  isLoading,
  alunoNome
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Registro</DialogTitle>
          <DialogDescription>
            {alunoNome ? `Editando o registro de ${alunoNome}` : 'Editando registro'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="presente">Presente</Label>
            <input
              type="checkbox"
              id="presente"
              name="presente"
              checked={formData.presente}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="apostila">Apostila</Label>
            <Input
              id="apostila"
              name="apostila"
              value={formData.apostila}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="pagina">Página</Label>
            <Input
              id="pagina"
              name="pagina"
              value={formData.pagina}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="exercicios">Exercícios</Label>
            <Input
              id="exercicios"
              name="exercicios"
              type="number"
              value={formData.exercicios}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="erros">Erros</Label>
            <Input
              id="erros"
              name="erros"
              type="number"
              value={formData.erros}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Label htmlFor="fez_desafio">Fez Desafio</Label>
            <input
              type="checkbox"
              id="fez_desafio"
              name="fez_desafio"
              checked={formData.fez_desafio}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="comentario">Comentário</Label>
            <textarea
              id="comentario"
              name="comentario"
              className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={formData.comentario}
              onChange={handleTextareaChange}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" onClick={onSave} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditRegistroModal;
