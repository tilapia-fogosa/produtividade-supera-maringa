
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, differenceInMonths } from 'date-fns';
import { useIsMobile } from "@/hooks/use-mobile";

interface AlunoProgressoCardProps {
  apostilaAtual?: string | null;
  ultimaPaginaCorrigida?: string | null;
  paginasRestantes?: number | null;
  ultimaCorrecaoAH?: string | null;
}

const AlunoProgressoCard: React.FC<AlunoProgressoCardProps> = ({
  apostilaAtual,
  ultimaPaginaCorrigida,
  paginasRestantes,
  ultimaCorrecaoAH
}) => {
  const isMobile = useIsMobile();

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

  return (
    <Card className={`w-full ${isMobile ? 'text-sm' : ''} border-orange-200`}>
      <CardHeader>
        <CardTitle className={`${isMobile ? 'text-lg' : ''} text-azul-500`}>Progresso do Aluno</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-azul-400">Apostila Atual:</span>
          <span className="font-semibold text-azul-500">{apostilaAtual || 'Não definido'}</span>
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
      </CardContent>
    </Card>
  );
};

export default AlunoProgressoCard;
