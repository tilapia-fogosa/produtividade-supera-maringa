import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparacaoTemporalCardProps {
  titulo: string;
  periodo: string;
  valorAtual: number;
  totalCasos: number;
  variacaoAnterior: number;
  variacaoAnoAnterior: number;
  isLoading?: boolean;
}

export function ComparacaoTemporalCard({
  titulo,
  periodo,
  valorAtual,
  totalCasos,
  variacaoAnterior,
  variacaoAnoAnterior,
  isLoading = false,
}: ComparacaoTemporalCardProps) {
  const getVariacaoIcon = (variacao: number) => {
    if (variacao > 0) return TrendingUp;
    if (variacao < 0) return TrendingDown;
    return Minus;
  };

  const getVariacaoColor = (variacao: number) => {
    if (variacao > 0) return "text-emerald-600 dark:text-emerald-400";
    if (variacao < 0) return "text-red-600 dark:text-red-400";
    return "text-muted-foreground";
  };

  const getVariacaoBackground = (variacao: number) => {
    if (variacao > 0) return "bg-emerald-50 dark:bg-emerald-950/20";
    if (variacao < 0) return "bg-red-50 dark:bg-red-950/20";
    return "bg-muted/20";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="h-5 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-4 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{titulo}</CardTitle>
        <p className="text-sm text-muted-foreground">{periodo}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{valorAtual.toFixed(1)} dias</p>
              <p className="text-sm text-muted-foreground">
                {totalCasos} caso{totalCasos !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className={cn(
              "flex items-center justify-between p-2 rounded-lg",
              getVariacaoBackground(variacaoAnterior)
            )}>
              <span className="text-sm font-medium">vs. período anterior</span>
              <div className={cn("flex items-center gap-1", getVariacaoColor(variacaoAnterior))}>
                {(() => {
                  const Icon = getVariacaoIcon(variacaoAnterior);
                  return <Icon className="w-4 h-4" />;
                })()}
                <span className="text-sm font-medium">
                  {Math.abs(variacaoAnterior).toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className={cn(
              "flex items-center justify-between p-2 rounded-lg",
              getVariacaoBackground(variacaoAnoAnterior)
            )}>
              <span className="text-sm font-medium">vs. ano anterior</span>
              <div className={cn("flex items-center gap-1", getVariacaoColor(variacaoAnoAnterior))}>
                {(() => {
                  const Icon = getVariacaoIcon(variacaoAnoAnterior);
                  return <Icon className="w-4 h-4" />;
                })()}
                <span className="text-sm font-medium">
                  {Math.abs(variacaoAnoAnterior).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}