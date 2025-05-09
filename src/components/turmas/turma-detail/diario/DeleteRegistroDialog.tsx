
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
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DeleteRegistroDialogProps {
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

  const handleExcluir = async () => {
    try {
      setExcluindo(true);
      
      console.log('Excluindo registro:', registroSelecionado.id);
      
      const { error } = await supabase
        .from('produtividade_abaco')
        .delete()
        .eq('id', registroSelecionado.id);
      
      if (error) throw error;
      
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

  if (!registroSelecionado) return null;

  const aluno = registroSelecionado.pessoa?.nome || "Aluno não encontrado";
  const data = new Date(registroSelecionado.data_aula).toLocaleDateString('pt-BR');

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir registro</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o registro de <strong>{aluno}</strong> do dia <strong>{data}</strong>?
            <br />
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleExcluir();
            }}
            disabled={excluindo}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {excluindo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteRegistroDialog;
