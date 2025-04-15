import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, differenceInMonths, isThisMonth } from 'date-fns';
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { calcularPaginasRestantes } from '../utils/paginasUtils';
import { Progress } from "@/components/ui/progress"

interface AlunoProgressoCardProps {
  ultimo_nivel?: string | null;
  ultimaPaginaCorrigida?: string | null;
  paginasRestantes?: number | null;
  ultimaCorrecaoAH?: string | null;
  alunoId?: string;
}

const AlunoProgressoCard: React.FC<AlunoProgressoCardProps> = ({
  ultimo_nivel,
  ultimaPaginaCorrigida,
  paginasRestantes: paginasRestantesInicial,
  ultimaCorrecaoAH,
  alunoId
}) => {
  const isMobile = useIsMobile();
  const [faltouMes, setFaltouMes] = useState<boolean | null>(null);
  const [paginasRestantes, setPaginasRestantes] = useState<number | null>(paginasRestantesInicial ?? null);
  const [totalPaginas, setTotalPaginas] = useState<number | null>(null);

  useEffect(() => {
    const buscarPaginasRestantes = async () => {
      const restantes = await calcularPaginasRestantes(ultimo_nivel, ultimaPaginaCorrigida);
      setPaginasRestantes(restantes);

      if (ultimo_nivel) {
        const { data } = await supabase
          .from('apostilas')
          .select('total_paginas')
          .eq('nome', ultimo_nivel)
          .maybeSingle();
        
        setTotalPaginas(data?.total_paginas ?? null);
      }
    };

    buscarPaginasRestantes();
  }, [ultimo_nivel, ultimaPaginaCorrigida]);

  useEffect(() => {
    if (!alunoId) return;

    const verificarFaltasMes = async () => {
      if (!alunoId) return;

      const dataAtual = new Date();
      const primeiroDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
      const ultimoDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0);

      try {
        const { data: produtividade, error } = await supabase
          .from('produtividade_abaco')
          .select('*')
          .eq('aluno_id', alunoId)
          .eq('presente', false)
          .gte('data_aula', primeiroDiaMes.toISOString().split('T')[0])
          .lte('data_aula', ultimoDiaMes.toISOString().split('T')[0]);

        if (error) throw error;

        setFaltouMes(produtividade && produtividade.length > 0);
      } catch (error) {
        console.error('Erro ao verificar faltas:', error);
        setFaltouMes(null);
      }
    };

    verificarFaltasMes();
  }, [alunoId]);

  const formatarData = (data?: string | null) => {
    return data ? format(new Date(data), 'dd/MM/yyyy HH:mm') : 'Não registrado';
  };

  const getPaginasRestantesColor = (paginas?: number | null) => {
    if (paginas === null || paginas === undefined) return "";
    if (paginas < 5) return "text-red-600 font-bold";
    if (paginas < 10) return "text-yellow-600 font-bold";
    return "text-green-600 font-bold";
  };

  const getProgressoValue = () => {
    if (!totalPaginas || !ultimaPaginaCorrigida) return 0;
    const paginaAtual = parseInt(ultimaPaginaCorrigida, 10);
    if (isNaN(paginaAtual)) return 0;
    return Math.min(100, (paginaAtual / totalPaginas) * 100);
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

  return (
    <Card className={`w-full ${isMobile ? 'text-sm' : ''} border-orange-200`}>
      <CardHeader>
        <CardTitle className={`${isMobile ? 'text-lg' : ''} text-azul-500`}>Progresso do Aluno</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-azul-400">Apostila Atual:</span>
          <span className="font-semibold text-azul-500">{ultimo_nivel || 'Não definido'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-azul-400">Última Página:</span>
          <span className="font-semibold text-azul-500">{ultimaPaginaCorrigida || 'Não registrado'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-azul-400">Páginas Restantes:</span>
          <span className={`font-semibold ${getPaginasRestantesColor(paginasRestantes)}`}>
            {paginasRestantes !== null ? paginasRestantes : 'Não calculado'}
          </span>
        </div>
        {totalPaginas && (
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
          <span className={`font-semibold ${getUltimaCorrecaoAHColor(ultimaCorrecaoAH)}`}>
            {formatarData(ultimaCorrecaoAH)}
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
