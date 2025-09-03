import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, GraduationCap, Calendar, AlertTriangle, Shield, BookOpen, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { HistoricoTimeline } from './HistoricoTimeline';
import { HistoricoRetencoes } from './HistoricoRetencoes';
import { HistoricoAlertas } from './HistoricoAlertas';
import { RelatorioAulaZero } from './RelatorioAulaZero';
import { useRetencoesHistorico } from '@/hooks/use-retencoes-historico';

interface HistoricoAlunoModalProps {
  isOpen: boolean;
  onClose: () => void;
  aluno: any;
  onCasoResolvido?: () => void;
}

export function HistoricoAlunoModal({ isOpen, onClose, aluno, onCasoResolvido }: HistoricoAlunoModalProps) {
  const [historicoCompleto, setHistoricoCompleto] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [resolvendo, setResolvendo] = useState(false);
  const { fetchHistoricoAluno, resolverCaso } = useRetencoesHistorico({ searchTerm: '', statusFilter: 'todos' });

  useEffect(() => {
    if (isOpen && aluno) {
      loadHistoricoCompleto();
    }
  }, [isOpen, aluno]);

  const loadHistoricoCompleto = async () => {
    if (!aluno) return;
    
    try {
      setLoading(true);
      const historico = await fetchHistoricoAluno(aluno.id);
      setHistoricoCompleto(historico);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolverCaso = async () => {
    if (!aluno || aluno.ocultoRetencoes) return;
    
    try {
      setResolvendo(true);
      await resolverCaso(aluno.id);
      
      toast({
        title: "Caso resolvido",
        description: "O caso foi marcado como resolvido e removido da lista principal.",
      });
      
      onCasoResolvido?.();
    } catch (error) {
      console.error('Erro ao resolver caso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível resolver o caso. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setResolvendo(false);
    }
  };

  if (!aluno) return null;

  const getStatusColor = () => {
    switch (aluno.status) {
      case 'critico':
        return 'bg-destructive text-destructive-foreground';
      case 'alerta':
        return 'bg-yellow-500 text-white';
      case 'retencao':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusText = () => {
    switch (aluno.status) {
      case 'critico':
        return 'Crítico';
      case 'alerta':
        return 'Em Alerta';
      case 'retencao':
        return 'Retenção';
      default:
        return 'Normal';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-3">
              <User className="h-6 w-6 text-primary" />
              <span className="text-2xl">{aluno.nome}</span>
            </DialogTitle>
            <div className="flex items-center gap-3">
              {!aluno.ocultoRetencoes && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="default" size="sm" disabled={resolvendo}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Resolver Caso
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Resolver caso de {aluno.nome}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação marcará o caso como resolvido e o removerá da lista principal de retenções. 
                        O histórico permanecerá disponível no modo "Mostrar histórico completo".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResolverCaso}>
                        {resolvendo ? "Resolvendo..." : "Resolver Caso"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Badge className={getStatusColor()}>
                {aluno.ocultoRetencoes ? 'Resolvido' : getStatusText()}
              </Badge>
            </div>
          </div>

          {/* Informações básicas */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-4 w-4" />
              <span>{aluno.turma}</span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Prof. {aluno.educador}</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span>{aluno.alertasAtivos} alertas ativos</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>{aluno.totalRetencoes} retenções</span>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="timeline" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="retencoes" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Retenções</span>
            </TabsTrigger>
            <TabsTrigger value="alertas" className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Alertas</span>
            </TabsTrigger>
            <TabsTrigger value="aula-zero" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Aula Zero</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-6">
            <HistoricoTimeline 
              historicoCompleto={historicoCompleto} 
              loading={loading} 
            />
          </TabsContent>

          <TabsContent value="retencoes" className="mt-6">
            <HistoricoRetencoes 
              retencoes={historicoCompleto?.retencoes || []} 
              loading={loading} 
            />
          </TabsContent>

          <TabsContent value="alertas" className="mt-6">
            <HistoricoAlertas 
              alertas={historicoCompleto?.alertas || []} 
              loading={loading} 
            />
          </TabsContent>

          <TabsContent value="aula-zero" className="mt-6">
            <RelatorioAulaZero 
              dadosAulaZero={historicoCompleto?.aulaZero || null} 
              loading={loading} 
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}