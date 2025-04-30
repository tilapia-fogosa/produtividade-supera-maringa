
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export interface DeleteRegistroDialogProps {
  isOpen: boolean;
  onClose: () => void;
  registroSelecionado: any;
  onSuccess: () => void;
}

const DeleteRegistroDialog: React.FC<DeleteRegistroDialogProps> = ({
  isOpen,
  onClose,
  registroSelecionado,
  onSuccess
}) => {
  const [excluindo, setExcluindo] = useState(false);

  const handleConfirmDelete = async () => {
    try {
      setExcluindo(true);
      
      // Chamar a função do Supabase para excluir
      const response = await fetch('/functions/v1/register-productivity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'delete',
          id: registroSelecionado.id
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir registro');
      }
      
      toast({
        title: "Sucesso",
        description: "Registro excluído com sucesso!",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao excluir registro:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir registro",
        variant: "destructive"
      });
    } finally {
      setExcluindo(false);
    }
  };

  if (!registroSelecionado) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirmDelete();
            }}
            disabled={excluindo}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {excluindo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteRegistroDialog;
