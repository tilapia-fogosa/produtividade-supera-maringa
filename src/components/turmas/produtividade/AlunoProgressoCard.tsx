
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
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

  return (
    <Card className={`w-full ${isMobile ? 'text-sm' : ''}`}>
      <CardHeader>
        <CardTitle className={isMobile ? 'text-lg' : ''}>Progresso do Aluno</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span>Apostila Atual:</span>
          <span className="font-semibold">{apostilaAtual || 'Não definido'}</span>
        </div>
        <div className="flex justify-between">
          <span>Última Página:</span>
          <span className="font-semibold">{ultimaPaginaCorrigida || 'Não registrado'}</span>
        </div>
        <div className="flex justify-between">
          <span>Páginas Restantes:</span>
          <span className="font-semibold">{paginasRestantes !== null ? paginasRestantes : 'Não calculado'}</span>
        </div>
        <div className="flex justify-between">
          <span>Última Correção AH:</span>
          <span className="font-semibold">{formatarData(ultimaCorrecaoAH)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlunoProgressoCard;
