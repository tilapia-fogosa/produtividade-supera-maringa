import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useListaReposicoes } from "@/hooks/use-lista-reposicoes";

interface ListaReposicoesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ListaReposicoesModal({ open, onOpenChange }: ListaReposicoesModalProps) {
  const { reposicoes, isLoading, error, deletarReposicao, isDeletingReposicao } = useListaReposicoes();

  const handleDeleteReposicao = (reposicaoId: string) => {
    deletarReposicao(reposicaoId);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Lista de Reposições
          </DialogTitle>
          <DialogDescription>
            Todas as reposições registradas no sistema. Use o botão de exclusão para remover uma reposição.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-40" />
                  <Skeleton className="h-10 w-40" />
                  <Skeleton className="h-10 w-20" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <AlertCircle className="mr-2 h-5 w-5" />
              Erro ao carregar reposições
            </div>
          ) : reposicoes.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Nenhuma reposição encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Data</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Turma Original</TableHead>
                  <TableHead className="font-semibold bg-primary/5">
                    Turma de Reposição
                  </TableHead>
                  <TableHead className="w-32">Observações</TableHead>
                  <TableHead className="w-20 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reposicoes.map((reposicao) => (
                  <TableRow key={reposicao.reposicao_id}>
                    <TableCell className="font-medium">
                      {formatDate(reposicao.data_reposicao)}
                    </TableCell>
                    <TableCell>{reposicao.aluno_nome}</TableCell>
                    <TableCell>{reposicao.turma_original_nome}</TableCell>
                    <TableCell className="font-semibold bg-primary/5">
                      {reposicao.turma_reposicao_nome}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {reposicao.observacoes || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isDeletingReposicao}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir esta reposição?
                              <br />
                              <br />
                              <strong>Aluno:</strong> {reposicao.aluno_nome}
                              <br />
                              <strong>Data:</strong> {formatDate(reposicao.data_reposicao)}
                              <br />
                              <strong>Turma de Reposição:</strong> {reposicao.turma_reposicao_nome}
                              <br />
                              <br />
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteReposicao(reposicao.reposicao_id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}