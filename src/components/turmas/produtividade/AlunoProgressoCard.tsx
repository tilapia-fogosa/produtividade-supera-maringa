
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { useIsMobile } from "@/hooks/use-mobile";
import { Progress } from "@/components/ui/progress";
import { useAlunoProgresso } from '@/hooks/use-aluno-progresso';
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Calendar, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface AlunoProgressoCardProps {
  alunoId?: string;
}

const AlunoProgressoCard: React.FC<AlunoProgressoCardProps> = ({ alunoId }) => {
  const isMobile = useIsMobile();
  const { progresso, loading, error } = useAlunoProgresso(alunoId || '');

  const formatarData = (data?: string | null) => {
    if (!data) return 'Não registrado';
    return format(new Date(data), 'dd/MM/yyyy HH:mm');
  };

  if (loading) {
    return (
      <Card className="w-full border-orange-200">
        <CardContent className="space-y-2 p-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-orange-200">
        <CardContent className="py-4">
          <p className="text-red-500 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-orange-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold text-azul-500">
          Progresso do Aluno
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-azul-500 flex items-center gap-2">
            <BookOpen size={16} />
            Apostila Atual:
          </span>
          <span className="font-semibold text-gray-700">
            {progresso?.ultimo_nivel || 'Não definido'}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-azul-500">Última Página:</span>
          <span className="font-semibold text-gray-700">
            {progresso?.ultima_pagina || 'Não registrado'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-azul-500">Páginas Restantes:</span>
          {progresso?.paginas_restantes !== null ? (
            <span className="font-semibold text-green-600">
              {progresso.paginas_restantes}
            </span>
          ) : (
            <div className="flex items-center text-amber-500 font-semibold">
              <AlertTriangle size={16} className="mr-1" />
              <span>Apostila não cadastrada</span>
            </div>
          )}
        </div>

        {progresso?.total_paginas && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Progresso da apostila</span>
              <span>{Math.round(progresso.progresso_percentual)}%</span>
            </div>
            <Progress 
              value={progresso.progresso_percentual} 
              className="h-2"
              indicatorClassName="bg-azul-300"
            />
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-azul-500 flex items-center gap-2">
            <Calendar size={16} />
            Última Correção AH:
          </span>
          <span className="text-orange-500 font-semibold">
            {formatarData(progresso?.ultima_correcao_ah)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-azul-500">Faltou esse mês?</span>
          <span className="font-semibold flex items-center gap-1">
            {progresso?.faltou_mes_atual === null ? (
              'Carregando...'
            ) : progresso?.faltou_mes_atual ? (
              <>
                <XCircle className="text-red-500" size={16} />
                <span className="text-red-500">Sim</span>
              </>
            ) : (
              <>
                <CheckCircle className="text-green-500" size={16} />
                <span className="text-green-500">Não</span>
              </>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlunoProgressoCard;
