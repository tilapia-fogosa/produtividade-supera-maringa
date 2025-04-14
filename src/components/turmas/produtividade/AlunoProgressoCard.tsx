import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, differenceInMonths, isThisMonth } from 'date-fns';
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

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
  paginasRestantes,
  ultimaCorrecaoAH,
  alunoId
}) => {
  const isMobile = useIsMobile();
  const [faltouMes, setFaltouMes] = useState<boolean | null>(null);

  useEffect(() => {
    if (!alunoId) return;

    const verificarFaltasMes = async () => {
      // Obter o primeiro dia do mês atual
      const dataAtual = new Date();
      const primeiroDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
      const ultimoDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0);

      try {
        const { data, error } = await supabase
          .from('faltas_alunos')
          .select('*')
          .eq('aluno_id', alunoId)
          .gte('data_falta', primeiroDiaMes.toISOString().split('T')[0])
          .lte('data_falta', ultimoDiaMes.toISOString().split('T')[0]);

        if (error) {
          throw error;
        }

        setFaltouMes(data && data.length > 0);
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
    return "";
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
