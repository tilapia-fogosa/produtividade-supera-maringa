import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, TrendingUp, Package, CheckCircle } from "lucide-react";
import { useAHTempoStats } from "@/hooks/use-ah-tempo-stats";
import { Skeleton } from "@/components/ui/skeleton";

export const EstatisticasAH = () => {
  const { data: stats, isLoading } = useAHTempoStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-12 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            Nenhum dado disponível ainda. Comece recolhendo e corrigindo apostilas!
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDias = (dias: number | null) => {
    if (dias === null) return "N/A";
    if (dias === 1) return "1 dia";
    return `${dias} dias`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
                <Clock className="h-5 w-5 text-purple-700 dark:text-purple-300" />
              </div>
              <CardTitle className="text-lg">Coleta → Correção</CardTitle>
            </div>
            <CardDescription>
              Tempo médio até a primeira correção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
              {formatDias(stats.tempo_medio_coleta_correcao)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-950 rounded-lg">
                <Package className="h-5 w-5 text-orange-700 dark:text-orange-300" />
              </div>
              <CardTitle className="text-lg">Coleta → Entrega</CardTitle>
            </div>
            <CardDescription>
              Tempo médio do processo completo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">
              {formatDias(stats.tempo_medio_coleta_entrega)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-700 dark:text-green-300" />
              </div>
              <CardTitle className="text-lg">Correção → Entrega</CardTitle>
            </div>
            <CardDescription>
              Tempo médio após correção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">
              {formatDias(stats.tempo_medio_correcao_entrega)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Totalizadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Total de apostilas corrigidas
              </p>
              <p className="text-2xl font-bold">
                {stats.total_apostilas_corrigidas}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Total de apostilas entregues
              </p>
              <p className="text-2xl font-bold">
                {stats.total_apostilas_entregues}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
