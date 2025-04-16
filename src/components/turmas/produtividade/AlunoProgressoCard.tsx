
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { useIsMobile } from "@/hooks/use-mobile";
import { Progress } from "@/components/ui/progress";
import { useAlunoProgresso } from '@/hooks/use-aluno-progresso';
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, BookOpen, Calendar, CheckCircle, XCircle } from "lucide-react";

interface AlunoProgressoCardProps {
  alunoId?: string;
}

const AlunoProgressoCard: React.FC<AlunoProgressoCardProps> = ({ alunoId }) => {
  const isMobile = useIsMobile();
  const { progresso, loading, error } = useAlunoProgresso(alunoId || '');
  const [expandido, setExpandido] = useState(false);

  const formatarData = (data?: string | null) => {
    if (!data) return 'Não registrado';
    return format(new Date(data), 'dd/MM/yyyy HH:mm');
  };

  const getUltimaCorrecaoAHColor = (dataStr?: string | null) => {
    if (!dataStr) return "text-gray-500";
    
    const data = new Date(dataStr);
    const hoje = new Date();
    const mesesDiferenca = Math.floor((hoje.getTime() - data.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    if (mesesDiferenca >= 4) return "text-red-600 font-bold";
    if (mesesDiferenca >= 3) return "text-amber-500 font-bold";
    return "text-green-600";
  };

  const getFaltouMesColor = (faltou: boolean | null) => {
    if (faltou === null) return "text-gray-500";
    return faltou ? "text-red-600 font-bold" : "text-green-600 font-bold";
  };

  const toggleExpandido = () => {
    setExpandido(!expandido);
  };

  if (loading) {
    return (
      <Card className={`w-full ${isMobile ? 'text-sm' : ''} border-orange-200`}>
        <CardHeader>
          <CardTitle className={`${isMobile ? 'text-lg' : ''} text-azul-500`}>
            Progresso do Aluno
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
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
      <Card className={`w-full ${isMobile ? 'text-sm' : ''} border-orange-200`}>
        <CardContent className="py-4">
          <p className="text-red-600 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${isMobile ? 'text-sm' : ''} border-orange-200`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className={`${isMobile ? 'text-lg' : ''} text-azul-500`}>
            Progresso do Aluno
          </CardTitle>
          <button 
            onClick={toggleExpandido} 
            className="text-azul-500 hover:text-azul-600 focus:outline-none"
          >
            {expandido ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-azul-400 flex items-center">
            <BookOpen size={16} className="mr-1" /> Apostila Atual:
          </span>
          <span className="font-semibold text-azul-500">
            {progresso?.apostila_atual || 'Não definido'}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-azul-400">Última Página:</span>
          <span className="font-semibold text-azul-500">
            {progresso?.ultima_pagina || 'Não registrado'}
          </span>
        </div>

        {progresso?.paginas_restantes !== null && progresso?.paginas_restantes !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-azul-400">Páginas Restantes:</span>
            <span className="font-semibold text-azul-500">
              {progresso.paginas_restantes}
            </span>
          </div>
        )}
        
        {progresso?.total_paginas && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progresso da apostila</span>
              <span>{Math.round(progresso.progresso_percentual)}%</span>
            </div>
            <Progress value={progresso.progresso_percentual} className="h-2" />
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-azul-400 flex items-center">
            <Calendar size={16} className="mr-1" /> Última Correção AH:
          </span>
          <span className={`font-semibold ${getUltimaCorrecaoAHColor(progresso?.ultima_correcao_ah)}`}>
            {formatarData(progresso?.ultima_correcao_ah)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-azul-400 flex items-center">
            {progresso?.faltou_mes_atual ? 
              <XCircle size={16} className="mr-1 text-red-500" /> : 
              <CheckCircle size={16} className="mr-1 text-green-500" />
            } 
            Faltou esse mês?
          </span>
          <span className={`font-semibold ${getFaltouMesColor(progresso?.faltou_mes_atual)}`}>
            {progresso?.faltou_mes_atual === null ? 'Carregando...' : progresso?.faltou_mes_atual ? 'Sim' : 'Não'}
          </span>
        </div>

        {expandido && (
          <>
            {progresso?.previsao_conclusao && (
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                <span className="text-azul-400">Previsão para Concluir:</span>
                <span className="font-semibold text-azul-500">
                  {progresso.previsao_conclusao}
                </span>
              </div>
            )}

            {progresso?.media_paginas_por_aula !== null && (
              <div className="flex justify-between items-center">
                <span className="text-azul-400">Média de Páginas/Aula:</span>
                <span className="font-semibold text-azul-500">
                  {progresso.media_paginas_por_aula.toFixed(1)}
                </span>
              </div>
            )}

            {progresso?.media_exercicios_por_aula !== null && (
              <div className="flex justify-between items-center">
                <span className="text-azul-400">Média de Exercícios/Aula:</span>
                <span className="font-semibold text-azul-500">
                  {progresso.media_exercicios_por_aula.toFixed(1)}
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AlunoProgressoCard;
