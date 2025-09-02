import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, GraduationCap, Calendar, AlertTriangle, Shield, BookOpen } from 'lucide-react';
import { HistoricoTimeline } from './HistoricoTimeline';
import { HistoricoRetencoes } from './HistoricoRetencoes';
import { HistoricoAlertas } from './HistoricoAlertas';
import { RelatorioAulaZero } from './RelatorioAulaZero';
import { useRetencoesHistorico } from '@/hooks/use-retencoes-historico';

interface HistoricoAlunoModalProps {
  isOpen: boolean;
  onClose: () => void;
  aluno: any;
}

export function HistoricoAlunoModal({ isOpen, onClose, aluno }: HistoricoAlunoModalProps) {
  const [historicoCompleto, setHistoricoCompleto] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { fetchHistoricoAluno } = useRetencoesHistorico({ searchTerm: '', statusFilter: 'todos' });

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
            <Badge className={getStatusColor()}>
              {getStatusText()}
            </Badge>
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