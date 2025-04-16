
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { useIsMobile } from "@/hooks/use-mobile";
import { Progress } from "@/components/ui/progress";
import { useAlunoProgresso } from '@/hooks/use-aluno-progresso';
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Calendar, CheckCircle, XCircle } from "lucide-react";

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
      <Card className="w-full bg-[#1A1F2C] border-orange-200">
        <CardContent className="space-y-2 p-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-4 w-[100px] bg-gray-700" />
              <Skeleton className="h-4 w-[150px] bg-gray-700" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full bg-[#1A1F2C] border-orange-200">
        <CardContent className="py-4">
          <p className="text-red-400 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-[#1A1F2C] border-orange-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-[#33C3F0] text-2xl font-bold">
          Progresso do Aluno
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[#33C3F0]">Apostila Atual:</span>
          <span className="text-white font-semibold">
            {progresso?.ultimo_nivel || 'Não definido'}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-[#33C3F0]">Última Página:</span>
          <span className="text-white font-semibold">
            {progresso?.ultima_pagina || 'Não registrado'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[#33C3F0]">Páginas Restantes:</span>
          <span className="text-green-400 font-semibold">
            {progresso?.paginas_restantes ?? 'N/A'}
          </span>
        </div>

        {progresso?.total_paginas && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[#8E9196]">
              <span>Progresso da apostila</span>
              <span>{Math.round(progresso.progresso_percentual)}%</span>
            </div>
            <Progress 
              value={progresso.progresso_percentual} 
              className="h-2 bg-gray-700"
              indicatorClassName="bg-[#33C3F0]"
            />
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-[#33C3F0] flex items-center gap-2">
            <Calendar size={16} />
            Última Correção AH:
          </span>
          <span className="text-[#DBA748] font-semibold">
            {formatarData(progresso?.ultima_correcao_ah)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[#33C3F0]">Faltou esse mês?</span>
          <span className={`font-semibold ${progresso?.faltou_mes_atual ? 'text-red-400' : 'text-green-400'}`}>
            {progresso?.faltou_mes_atual === null ? 'Carregando...' : progresso?.faltou_mes_atual ? 'Sim' : 'Não'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlunoProgressoCard;
