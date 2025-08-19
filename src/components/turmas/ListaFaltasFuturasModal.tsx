import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User, FileText, Trash2, History, CalendarDays, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useListaFaltasFuturas, type FaltaFutura } from "@/hooks/use-lista-faltas-futuras";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

interface ListaFaltasFuturasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ListaFaltasFuturasModal: React.FC<ListaFaltasFuturasModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: todasFaltas, isLoading, refetch } = useListaFaltasFuturas();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mostrarAnteriores, setMostrarAnteriores] = useState(false);

  const handleRefresh = async () => {
    // Forçar invalidação do cache e refetch
    queryClient.invalidateQueries({ queryKey: ['lista-faltas-futuras'] });
    await refetch();
    toast({
      title: "Dados atualizados!",
      description: "Lista de faltas futuras foi atualizada.",
    });
  };

  const deleteFaltaFutura = useMutation({
    mutationFn: async (faltaId: string) => {
      const { error } = await supabase
        .from('faltas_antecipadas')
        .delete()
        .eq('id', faltaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lista-faltas-futuras'] });
      toast({
        title: "Sucesso!",
        description: "Falta futura removida com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao remover falta futura:', error);
      toast({
        variant: "destructive",
        title: "Erro!",
        description: "Erro ao remover falta futura. Tente novamente.",
      });
    },
  });

  // Filtrar faltas baseado no estado do toggle
  const faltas = useMemo(() => {
    if (!todasFaltas) return [];
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    if (mostrarAnteriores) {
      return todasFaltas; // Mostra todas
    } else {
      // Mostra apenas futuras
      return todasFaltas.filter(falta => {
        const dataFalta = new Date(falta.data_falta);
        dataFalta.setHours(0, 0, 0, 0);
        return dataFalta > hoje;
      });
    }
  }, [todasFaltas, mostrarAnteriores]);

  const canDelete = (falta: FaltaFutura) => {
    const dataFalta = new Date(falta.data_falta);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataFalta.setHours(0, 0, 0, 0);
    return dataFalta > hoje;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  const getBadgeVariant = (tipo: string) => {
    return tipo === 'professor' ? 'default' : 'secondary';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {mostrarAnteriores ? 'Todas as Faltas' : 'Faltas Futuras'}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
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
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !faltas || faltas.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {mostrarAnteriores ? 'Todas as Faltas' : 'Faltas Futuras'} ({faltas?.length || 0})
              </h3>
              <div className="bg-muted/50 rounded-lg p-6 mx-4">
                <div className="text-muted-foreground space-y-2">
                  <p className="font-medium">
                    {mostrarAnteriores ? 'Nenhuma falta encontrada' : 'Nenhuma falta futura encontrada'}
                  </p>
                  <p className="text-sm">
                    {mostrarAnteriores 
                      ? 'Não há faltas registradas no sistema no momento.'
                      : 'Não há faltas futuras registradas no sistema no momento.'
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-medium">
                  {mostrarAnteriores ? 'Todas as Faltas' : 'Faltas Futuras'} ({faltas.length})
                </h3>
              </div>
              
              <div className="grid gap-4">
                {faltas.map((falta) => (
                  <Card key={falta.id} className="border border-border/40">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* Linha 1: Aluno e Turma */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{falta.aluno_nome}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Turma: {falta.turma_nome}
                            </div>
                          </div>

                           {/* Linha 2: Data da falta - DEBUG */}
                           <div className="flex items-center gap-2">
                             <Calendar className="h-4 w-4 text-red-500" />
                             <span className="text-sm font-medium">
                               <strong className="text-red-600">Data da falta:</strong> 
                               <span className="ml-1 text-red-700 font-bold">
                                 {formatDate(falta.data_falta)}
                               </span>
                               {/* Debug info */}
                               <span className="ml-2 text-xs text-muted-foreground">
                                 (Raw: {falta.data_falta})
                               </span>
                             </span>
                           </div>

                          {/* Linha 3: Responsável pelo aviso */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              <strong>Responsável:</strong> {falta.responsavel_aviso_nome}
                            </span>
                            <Badge variant={getBadgeVariant(falta.responsavel_aviso_tipo)}>
                              {falta.responsavel_aviso_tipo}
                            </Badge>
                          </div>

                          {/* Linha 4: Observações (se houver) */}
                          {falta.observacoes && (
                            <div className="flex items-start gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <span className="text-sm text-muted-foreground">
                                {falta.observacoes}
                              </span>
                            </div>
                          )}

                          <Separator />

                          {/* Linha 5: Data de registro */}
                          <div className="text-xs text-muted-foreground">
                            Registrado em: {formatDateTime(falta.created_at)}
                          </div>
                        </div>

                        {/* Botão de deletar */}
                        {canDelete(falta) && (
                          <div className="ml-4">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover falta futura?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja remover esta falta futura de {falta.aluno_nome}?
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteFaltaFutura.mutate(falta.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
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

export default ListaFaltasFuturasModal;