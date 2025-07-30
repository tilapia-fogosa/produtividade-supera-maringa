import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useListaAulasExperimentais, type AulaExperimentalLista } from "@/hooks/use-lista-aulas-experimentais";

interface ListaAulasExperimentaisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ListaAulasExperimentaisModal: React.FC<ListaAulasExperimentaisModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { aulasExperimentais, isLoading, error, deletarAulaExperimental, refetch } = useListaAulasExperimentais();

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const podeExcluir = (dataAula: string) => {
    const hoje = new Date();
    const dataAulaDate = parseISO(dataAula);
    return dataAulaDate > hoje;
  };

  const handleDelete = (aulaExperimentalId: string) => {
    deletarAulaExperimental.mutate(aulaExperimentalId);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lista de Aulas Experimentais</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Erro ao carregar as aulas experimentais
            </div>
          ) : aulasExperimentais.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma aula experimental encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Data</TableHead>
                  <TableHead className="w-32">Turma</TableHead>
                  <TableHead className="w-40">Cliente</TableHead>
                  <TableHead className="w-80">Descrição Detalhada</TableHead>
                  <TableHead className="w-40">Responsável</TableHead>
                  <TableHead className="w-20 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aulasExperimentais.map((aula: AulaExperimentalLista) => {
                  const canDelete = podeExcluir(aula.data_aula_experimental);
                  
                  return (
                    <TableRow key={aula.aula_experimental_id}>
                      <TableCell className="font-medium">
                        {formatDate(aula.data_aula_experimental)}
                      </TableCell>
                      <TableCell>{aula.turma_nome}</TableCell>
                      <TableCell>{aula.cliente_nome}</TableCell>
                      <TableCell className="text-sm max-w-80 break-words">
                        {aula.descricao_cliente || "Sem descrição"}
                      </TableCell>
                      <TableCell>
                        {aula.responsavel_nome}
                        <div className="text-xs text-muted-foreground">
                          ({aula.responsavel_tipo})
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {canDelete ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                disabled={deletarAulaExperimental.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a aula experimental de{" "}
                                  <strong>{aula.cliente_nome}</strong> agendada para{" "}
                                  <strong>{formatDate(aula.data_aula_experimental)}</strong>?
                                  <br />
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(aula.aula_experimental_id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground cursor-not-allowed"
                            disabled
                            title="Só é possível excluir aulas experimentais futuras"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ListaAulasExperimentaisModal;