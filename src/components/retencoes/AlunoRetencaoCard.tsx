import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, User, GraduationCap, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AlunoRetencaoCardProps {
  aluno: {
    id: string;
    nome: string;
    turma: string;
    educador: string;
    totalAlertas: number;
    alertasAtivos: number;
    totalRetencoes: number;
    ultimoAlerta: string | null;
    ultimaRetencao: string | null;
    status: 'critico' | 'alerta' | 'retencao' | 'normal';
    ocultoRetencoes?: boolean;
  };
  onClick: () => void;
}

export function AlunoRetencaoCard({ aluno, onClick }: AlunoRetencaoCardProps) {
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
    if (aluno.ocultoRetencoes) {
      return 'Resolvido';
    }
    
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return null;
    }
  };

  return (
    <Card className={`hover:shadow-md transition-shadow cursor-pointer group ${
      aluno.ocultoRetencoes ? 'opacity-60 bg-muted/30' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <h3 className={`font-semibold text-lg group-hover:text-primary transition-colors ${
              aluno.ocultoRetencoes ? 'line-through text-muted-foreground' : ''
            }`}>
              {aluno.nome}
            </h3>
          </div>
          <Badge className={aluno.ocultoRetencoes ? 'bg-muted text-muted-foreground' : getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Turma e Educador */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            <span>{aluno.turma}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Prof. {aluno.educador}</span>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-2 bg-muted/50 rounded-md">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">Alertas</span>
            </div>
            <div className="text-lg font-bold">
              {aluno.alertasAtivos}/{aluno.totalAlertas}
            </div>
            <div className="text-xs text-muted-foreground">ativos/total</div>
          </div>

          <div className="text-center p-2 bg-muted/50 rounded-md">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Retenções</span>
            </div>
            <div className="text-lg font-bold">{aluno.totalRetencoes}</div>
            <div className="text-xs text-muted-foreground">realizadas</div>
          </div>
        </div>

        {/* Últimas Atividades */}
        <div className="space-y-2">
          {aluno.ultimoAlerta && (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Último alerta: {formatDate(aluno.ultimoAlerta)}</span>
            </div>
          )}
          {aluno.ultimaRetencao && (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Última retenção: {formatDate(aluno.ultimaRetencao)}</span>
            </div>
          )}
        </div>

        {/* Botão de Ação */}
        <Button 
          onClick={onClick}
          className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          variant="outline"
        >
          Ver Histórico Completo
        </Button>
      </CardContent>
    </Card>
  );
}