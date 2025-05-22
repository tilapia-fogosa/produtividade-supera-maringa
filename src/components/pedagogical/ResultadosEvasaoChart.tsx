
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart } from "lucide-react";

interface ResultadoPeriodo {
  periodo: string;
  total: number;
  evadidos: number;
  retidos: number;
  percentualRetencao: number;
  comparacaoAnterior?: {
    total: number;
    evadidos: number;
    retidos: number;
    percentualRetencao: number;
    diferencaPercentual: number;
  };
  comparacaoAnoAnterior?: {
    total: number;
    evadidos: number;
    retidos: number;
    percentualRetencao: number;
    diferencaPercentual: number;
  };
}

interface ResultadosEvasaoChartProps {
  resultados: ResultadoPeriodo[];
}

export function ResultadosEvasaoChart({ resultados }: ResultadosEvasaoChartProps) {
  const chartData = resultados.map(result => ({
    name: result.periodo.split(' ')[0], // Usar apenas o nome do período (Mês, Trimestre, etc)
    Evadidos: result.evadidos,
    Retidos: result.retidos,
    'Taxa de Retenção': result.percentualRetencao,
  }));

  const chartConfig = {
    Evadidos: {
      color: "#ef4444"  // vermelho
    },
    Retidos: {
      color: "#22c55e"  // verde
    },
    "Taxa de Retenção": {
      color: "#f97316"  // laranja
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <PieChart className="h-5 w-5 mr-2 text-orange-500" />
          Gráfico de Retenção e Evasão
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] md:h-[400px]">
          <ChartContainer
            config={chartConfig}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis yAxisId="left" orientation="left" stroke="#888" />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#f97316" 
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]} 
                />
                <Tooltip 
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      formatter={(value, name) => [
                        name === 'Taxa de Retenção' ? `${value}%` : value, 
                        name
                      ]}
                    />
                  } 
                />
                <Legend />
                <Bar 
                  yAxisId="left" 
                  dataKey="Evadidos" 
                  fill="#ef4444" 
                  radius={[4, 4, 0, 0]} 
                  barSize={30}
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="Retidos" 
                  fill="#22c55e" 
                  radius={[4, 4, 0, 0]} 
                  barSize={30} 
                />
                <Bar 
                  yAxisId="right" 
                  dataKey="Taxa de Retenção" 
                  fill="#f97316" 
                  radius={[4, 4, 0, 0]}
                  barSize={10} 
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
