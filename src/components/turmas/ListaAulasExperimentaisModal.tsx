import React, { useEffect, useState, useMemo } from "react";
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
import { AlertTriangle, Trash2, FileText, History, CalendarDays, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { ObservacoesView } from "./ObservacoesView";

interface ListaAulasExperimentaisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ListaAulasExperimentaisModal: React.FC<ListaAulasExperimentaisModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { aulasExperimentais: todasAulas, isLoading, error, deletarAulaExperimental, refetch } = useListaAulasExperimentais();
  const [selectedObservacoes, setSelectedObservacoes] = useState<{
    observacoes: string;
    alunoNome: string;
    dataAula: string;
  } | null>(null);
  const [mostrarAnteriores, setMostrarAnteriores] = useState(false);

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  // Filtrar aulas baseado no estado do toggle
  const aulasExperimentais = useMemo(() => {
    if (!todasAulas) return [];
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    if (mostrarAnteriores) {
      return todasAulas; // Mostra todas
    } else {
      // Mostra apenas futuras
      return todasAulas.filter(aula => {
        const dataAula = parseISO(aula.data_aula_experimental);
        dataAula.setHours(0, 0, 0, 0);
        return dataAula >= hoje; // Incluir aulas de hoje e futuras
      });
    }
  }, [todasAulas, mostrarAnteriores]);

  const podeExcluir = (dataAula: string) => {
    const hoje = new Date();
    const dataAulaDate = parseISO(dataAula);
    return dataAulaDate > hoje;
  };

  const handleDelete = (aulaExperimentalId: string) => {
    deletarAulaExperimental.mutate(aulaExperimentalId);
  };

  const handleVerObservacoes = (observacoes: string, clienteNome: string, dataAula: string) => {
    setSelectedObservacoes({
      observacoes,
      alunoNome: clienteNome,
      dataAula: formatDate(dataAula)
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dateString;
    }
  };

  if (selectedObservacoes) {
    return (
      <ObservacoesView
        observacoes={selectedObservacoes.observacoes}
        alunoNome={selectedObservacoes.alunoNome}
        dataReposicao={selectedObservacoes.dataAula}
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
              {mostrarAnteriores ? 'Todas as Aulas Experimentais' : 'Aulas Experimentais Futuras'}
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
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
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
              <div className="space-y-2">
                <p className="font-medium">
                  {mostrarAnteriores ? 'Nenhuma aula experimental encontrada' : 'Nenhuma aula experimental futura encontrada'}
                </p>
                <p className="text-sm">
                  {mostrarAnteriores 
                    ? 'Não há aulas experimentais registradas no sistema no momento.'
                    : 'Não há aulas experimentais futuras registradas no sistema no momento.'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-medium">
                  {mostrarAnteriores ? 'Todas as Aulas Experimentais' : 'Aulas Experimentais Futuras'} ({aulasExperimentais.length})
                </h3>
              </div>
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Data</TableHead>
                    <TableHead className="w-32">Turma</TableHead>
                    <TableHead className="w-32">Cliente</TableHead>
                    <TableHead className="w-40">Descrição</TableHead>
                    <TableHead className="w-32">Responsável</TableHead>
                    <TableHead className="w-28 text-center">Ações</TableHead>
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
                        <TableCell className="text-sm max-w-40 break-words">
                          {aula.descricao_cliente ? (
                            <span className="truncate block">
                              {aula.descricao_cliente}
                            </span>
                          ) : "Sem descrição"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {aula.responsavel_nome}
                          <div className="text-xs text-muted-foreground">
                            ({aula.responsavel_tipo})
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-1 justify-center">
                            {aula.descricao_cliente && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVerObservacoes(
                                  aula.descricao_cliente!,
                                  aula.cliente_nome,
                                  aula.data_aula_experimental
                                )}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}
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
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground cursor-not-allowed"
                                  disabled
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Aulas experimentais passadas não podem ser excluídas</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TooltipProvider>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ListaAulasExperimentaisModal;