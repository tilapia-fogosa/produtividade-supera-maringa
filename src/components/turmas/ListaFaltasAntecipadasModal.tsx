import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, UserMinus, Calendar, User, Users } from "lucide-react";
import { format, parseISO, isFuture } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useListaFaltasAntecipadas, type FaltaAntecipada } from "@/hooks/use-lista-faltas-antecipadas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ListaFaltasAntecipadasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ListaFaltasAntecipadasModal: React.FC<ListaFaltasAntecipadasModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: faltas, isLoading } = useListaFaltasAntecipadas();
  const queryClient = useQueryClient();

  const deleteFaltaAntecipada = useMutation({
    mutationFn: async (faltaId: string) => {
      const { error } = await supabase
        .from('faltas_antecipadas')
        .update({ active: false })
        .eq('id', faltaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lista-faltas-antecipadas'] });
      queryClient.invalidateQueries({ queryKey: ['calendario-turmas'] });
      toast({
        title: "Sucesso",
        description: "Falta antecipada removida com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao remover falta antecipada:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover falta antecipada. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const canDelete = (falta: FaltaAntecipada) => {
    try {
      const dataFalta = parseISO(falta.data_falta);
      return isFuture(dataFalta);
    } catch {
      return false;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5" />
              Faltas Antecipadas
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5" />
            Faltas Antecipadas ({faltas?.length || 0})
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {!faltas || faltas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserMinus className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Nenhuma falta antecipada encontrada
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Não há faltas antecipadas registradas no sistema no momento.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data
                    </div>
                  </TableHead>
                  <TableHead className="w-32">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Turma
                    </div>
                  </TableHead>
                  <TableHead className="w-32">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Aluno
                    </div>
                  </TableHead>
                  <TableHead className="w-40">Observações</TableHead>
                  <TableHead className="w-32">Responsável</TableHead>
                  <TableHead className="w-28 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faltas.map((falta) => (
                  <TableRow key={falta.id}>
                    <TableCell className="font-medium">
                      {formatDate(falta.data_falta)}
                    </TableCell>
                    <TableCell>{falta.turma_nome}</TableCell>
                    <TableCell>{falta.aluno_nome}</TableCell>
                    <TableCell className="text-sm max-w-40 break-words">
                      {falta.observacoes ? (
                        <span className="truncate block">
                          {falta.observacoes}
                        </span>
                      ) : "Sem observações"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {falta.responsavel_aviso_nome}
                      <div className="text-xs text-muted-foreground">
                        ({falta.responsavel_aviso_tipo})
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {canDelete(falta) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover falta antecipada?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover esta falta antecipada de {falta.aluno_nome}?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteFaltaAntecipada.mutate(falta.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {!canDelete(falta) && (
                        <span className="text-xs text-muted-foreground">
                          Não editável
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ListaFaltasAntecipadasModal;