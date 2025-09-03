import React from "react";
import { useResultadosTemporaisRetencao } from "@/hooks/use-resultados-temporais-retencao";
import { ComparacaoTemporalCard } from "@/components/retencoes/ComparacaoTemporalCard";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Calendar, BarChart3, Clock } from "lucide-react";

export default function ResultadosMensais() {
  const { data: resultados, isLoading, error } = useResultadosTemporaisRetencao();

  // Organizar dados por período
  const dadosPorPeriodo = {
    mes: resultados?.find(r => r.periodo_tipo === 'mes'),
    trimestre: resultados?.find(r => r.periodo_tipo === 'trimestre'),
    semestre: resultados?.find(r => r.periodo_tipo === 'semestre'),
    ano: resultados?.find(r => r.periodo_tipo === 'ano')
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">
              Erro ao carregar a análise temporal de retenção.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Análise Temporal de Retenção</h1>
            <p className="text-muted-foreground">
              Média de dias que alunos permaneceram matriculados após primeira retenção
            </p>
          </div>
        </div>
        <div className="h-px bg-border" />
      </div>

      {/* Cards de Análise Temporal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Último Mês */}
        <ComparacaoTemporalCard
          titulo="Último Mês"
          periodo={dadosPorPeriodo.mes?.periodo_nome || "-"}
          valorAtual={dadosPorPeriodo.mes?.media_dias_retencao || 0}
          totalCasos={dadosPorPeriodo.mes?.total_casos || 0}
          variacaoAnterior={dadosPorPeriodo.mes?.variacao_percentual_anterior || 0}
          variacaoAnoAnterior={dadosPorPeriodo.mes?.variacao_percentual_ano_anterior || 0}
          isLoading={isLoading}
        />

        {/* Último Trimestre */}
        <ComparacaoTemporalCard
          titulo="Último Trimestre"
          periodo={dadosPorPeriodo.trimestre?.periodo_nome || "-"}
          valorAtual={dadosPorPeriodo.trimestre?.media_dias_retencao || 0}
          totalCasos={dadosPorPeriodo.trimestre?.total_casos || 0}
          variacaoAnterior={dadosPorPeriodo.trimestre?.variacao_percentual_anterior || 0}
          variacaoAnoAnterior={dadosPorPeriodo.trimestre?.variacao_percentual_ano_anterior || 0}
          isLoading={isLoading}
        />

        {/* Último Semestre */}
        <ComparacaoTemporalCard
          titulo="Último Semestre"
          periodo={dadosPorPeriodo.semestre?.periodo_nome || "-"}
          valorAtual={dadosPorPeriodo.semestre?.media_dias_retencao || 0}
          totalCasos={dadosPorPeriodo.semestre?.total_casos || 0}
          variacaoAnterior={dadosPorPeriodo.semestre?.variacao_percentual_anterior || 0}
          variacaoAnoAnterior={dadosPorPeriodo.semestre?.variacao_percentual_ano_anterior || 0}
          isLoading={isLoading}
        />

        {/* Este Ano */}
        <ComparacaoTemporalCard
          titulo="Este Ano"
          periodo={dadosPorPeriodo.ano?.periodo_nome || "-"}
          valorAtual={dadosPorPeriodo.ano?.media_dias_retencao || 0}
          totalCasos={dadosPorPeriodo.ano?.total_casos || 0}
          variacaoAnterior={dadosPorPeriodo.ano?.variacao_percentual_anterior || 0}
          variacaoAnoAnterior={dadosPorPeriodo.ano?.variacao_percentual_ano_anterior || 0}
          isLoading={isLoading}
        />
      </div>

      {/* Insights Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Período Mais Recente
              </p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {dadosPorPeriodo.mes?.periodo_nome || "Carregando..."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Total de Casos (Ano)
              </p>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                {dadosPorPeriodo.ano?.total_casos || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Média Anual
              </p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                {dadosPorPeriodo.ano?.media_dias_retencao?.toFixed(1) || "0"} dias
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Explicação */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">Como interpretar estes dados</h3>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              • <strong>Média de dias:</strong> Tempo médio que um aluno permanece matriculado após receber sua primeira retenção
            </p>
            <p>
              • <strong>Variação positiva (verde):</strong> Indica que os alunos estão permanecendo mais tempo após retenção
            </p>
            <p>
              • <strong>Variação negativa (vermelha):</strong> Indica que os alunos estão saindo mais rapidamente após retenção
            </p>
            <p>
              • <strong>Comparações:</strong> Período anterior vs. mesmo período do ano passado para identificar tendências
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}