import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Trash2, AlertCircle, FileText, History, CalendarDays, RefreshCw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useListaReposicoes } from "@/hooks/use-lista-reposicoes";
import { ObservacoesView } from "./ObservacoesView";

interface ListaReposicoesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ListaReposicoesModal({ open, onOpenChange }: ListaReposicoesModalProps) {
  const [mostrarAnteriores, setMostrarAnteriores] = useState(false);
  const [filtroNome, setFiltroNome] = useState("");
  
  const { reposicoes: todasReposicoes, isLoading, error, deletarReposicao, isDeletingReposicao, refetch } = useListaReposicoes(mostrarAnteriores);
  const [selectedObservacoes, setSelectedObservacoes] = useState<{
    observacoes: string;
    alunoNome: string;
    dataReposicao: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  // Filtrar reposições apenas por nome (a filtragem por data agora é feita no backend)
  const reposicoes = useMemo(() => {
    if (!todasReposicoes) return [];
    
    let reposicoesFiltradas = todasReposicoes;
    
    // Filtrar por nome do aluno
    if (filtroNome.trim()) {
      reposicoesFiltradas = reposicoesFiltradas.filter(reposicao =>
        reposicao.aluno_nome.toLowerCase().includes(filtroNome.toLowerCase())
      );
    }
    
    return reposicoesFiltradas;
  }, [todasReposicoes, filtroNome]);

  const handleDeleteReposicao = (reposicaoId: string) => {
    deletarReposicao(reposicaoId);
  };

  const handleVerObservacoes = (observacoes: string, alunoNome: string, dataReposicao: string) => {
    setSelectedObservacoes({
      observacoes,
      alunoNome,
      dataReposicao: formatDate(dataReposicao)
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  if (selectedObservacoes) {
    return (
      <ObservacoesView
        observacoes={selectedObservacoes.observacoes}
        alunoNome={selectedObservacoes.alunoNome}
        dataReposicao={selectedObservacoes.dataReposicao}
        onVoltar={() => setSelectedObservacoes(null)}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {mostrarAnteriores ? 'Todas as Reposições' : 'Reposições Futuras'}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarAnteriores(!mostrarAnteriores)}
                className="flex items-center gap-2"
              >
                {mostrarAnteriores ? (
                  <>
                    <CalendarDays className="h-4 w-4" />
                    Apenas Futuras
                  </>
                ) : (
                  <>
                    <History className="h-4 w-4" />
                    Incluir Anteriores
                  </>
                )}
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            {mostrarAnteriores 
              ? 'Todas as reposições registradas no sistema. Use o botão de exclusão para remover uma reposição.'
              : 'Reposições futuras registradas no sistema. Use o botão de exclusão para remover uma reposição.'
            }
          </DialogDescription>
          <div className="mt-4">
            <Input
              placeholder="Filtrar por nome do aluno..."
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
            />
          </div>
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
            <div className="text-center py-8 text-muted-foreground">
              <div className="space-y-2">
                <p className="font-medium">
                  {mostrarAnteriores ? 'Nenhuma reposição encontrada' : 'Nenhuma reposição futura encontrada'}
                </p>
                <p className="text-sm">
                  {mostrarAnteriores 
                    ? 'Não há reposições registradas no sistema no momento.'
                    : 'Não há reposições futuras registradas no sistema no momento.'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-medium">
                  {mostrarAnteriores ? 'Todas as Reposições' : 'Reposições Futuras'} ({reposicoes.length})
                </h3>
              </div>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Data Reposição</TableHead>
                  <TableHead className="w-28">Data Falta</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Turma Original</TableHead>
                  <TableHead className="font-semibold bg-primary/5">
                    Turma de Reposição
                  </TableHead>
                  <TableHead className="w-32">Observações</TableHead>
                  <TableHead className="w-32 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reposicoes.map((reposicao) => (
                  <TableRow key={reposicao.reposicao_id}>
                    <TableCell className="font-medium">
                      {formatDate(reposicao.data_reposicao)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {reposicao.data_falta ? formatDate(reposicao.data_falta) : "-"}
                    </TableCell>
                    <TableCell>{reposicao.aluno_nome}</TableCell>
                    <TableCell>{reposicao.turma_original_nome}</TableCell>
                    <TableCell className="font-semibold bg-primary/5">
                      {reposicao.turma_reposicao_nome}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {reposicao.observacoes ? (
                        <span className="truncate block max-w-32">
                          {reposicao.observacoes}
                        </span>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        {reposicao.observacoes && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVerObservacoes(
                              reposicao.observacoes!,
                              reposicao.aluno_nome,
                              reposicao.data_reposicao
                            )}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}