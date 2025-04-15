
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, differenceInMonths, isThisMonth } from 'date-fns';
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { useAlunoProgresso } from '@/hooks/use-aluno-progresso';
import { Skeleton } from "@/components/ui/skeleton";

interface AlunoProgressoCardProps {
  alunoId?: string;
}

const AlunoProgressoCard: React.FC<AlunoProgressoCardProps> = ({ alunoId }) => {
  const isMobile = useIsMobile();
  const [faltouMes, setFaltouMes] = useState<boolean | null>(null);
  const { progresso, loading, error } = useAlunoProgresso(alunoId || '');

  useEffect(() => {
    if (!alunoId) return;

    const verificarFaltasMes = async () => {
      const dataAtual = new Date();
      const primeiroDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
      const ultimoDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0);

      try {
        const { data: presencas, error } = await supabase
          .from('presencas')
          .select('*')
          .eq('aluno_id', alunoId)
          .eq('presente', false)
          .gte('data_aula', primeiroDiaMes.toISOString().split('T')[0])
          .lte('data_aula', ultimoDiaMes.toISOString().split('T')[0]);

        if (error) throw error;

        setFaltouMes(presencas && presencas.length > 0);
      } catch (error) {
        console.error('Erro ao verificar faltas:', error);
        setFaltouMes(null);
      }
    };

    verificarFaltasMes();
  }, [alunoId]);

  const formatarData = (data?: string | null) => {
    if (!data) return 'Não registrado';
    return format(new Date(data), 'dd/MM/yyyy HH:mm');
  };

  const getUltimaCorrecaoAHColor = (dataStr?: string | null) => {
    if (!dataStr) return "";
    
    const data = new Date(dataStr);
    const hoje = new Date();
    const mesesDiferenca = differenceInMonths(hoje, data);
    
    if (mesesDiferenca >= 4) return "text-red-600 font-bold";
    if (mesesDiferenca >= 3) return "text-yellow-600 font-bold";
    return "";
  };

  const getFaltouMesColor = (faltou: boolean | null) => {
    if (faltou === null) return "";
    return faltou ? "text-red-600 font-bold" : "text-green-600 font-bold";
  };

  const getProgressoValue = () => {
    if (!progresso?.total_paginas || !progresso.ultima_pagina) return 0;
    const paginaAtual = parseInt(progresso.ultima_pagina, 10);
    if (isNaN(paginaAtual)) return 0;
    return Math.min(100, (paginaAtual / progresso.total_paginas) * 100);
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
      <CardHeader>
        <CardTitle className={`${isMobile ? 'text-lg' : ''} text-azul-500`}>
          Progresso do Aluno
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-azul-400">Apostila Atual:</span>
          <span className="font-semibold text-azul-500">
            {progresso?.apostila_atual || 'Não definido'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-azul-400">Última Página:</span>
          <span className="font-semibold text-azul-500">
            {progresso?.ultima_pagina || 'Não registrado'}
          </span>
        </div>
        {progresso?.total_paginas && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progresso da apostila</span>
              <span>{Math.round(getProgressoValue())}%</span>
            </div>
            <Progress value={getProgressoValue()} className="h-2" />
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-azul-400">Última Correção AH:</span>
          <span className={`font-semibold ${getUltimaCorrecaoAHColor(progresso?.ultima_correcao_ah)}`}>
            {formatarData(progresso?.ultima_correcao_ah)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-azul-400">Faltou esse mês?</span>
          <span className={`font-semibold ${getFaltouMesColor(faltouMes)}`}>
            {faltouMes === null ? 'Carregando...' : faltouMes ? 'Sim' : 'Não'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlunoProgressoCard;
