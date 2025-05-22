
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDownIcon, ArrowUpIcon, BarChart3 } from "lucide-react";

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

interface ResultadosEvasaoCardProps {
  resultados: ResultadoPeriodo[];
  isLoading: boolean;
}

export function ResultadosEvasaoCard({ resultados, isLoading }: ResultadosEvasaoCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <BarChart3 className="h-5 w-5 mr-2 text-orange-500" />
            Estatísticas de Retenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Carregando estatísticas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <BarChart3 className="h-5 w-5 mr-2 text-orange-500" />
          Estatísticas de Retenção
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Evadidos</TableHead>
                <TableHead className="text-right">Retidos</TableHead>
                <TableHead className="text-right">% Retenção</TableHead>
                <TableHead className="text-right">Vs. Período Anterior</TableHead>
                <TableHead className="text-right">Vs. Ano Anterior</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultados.map((resultado, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{resultado.periodo}</TableCell>
                  <TableCell className="text-right">{resultado.total}</TableCell>
                  <TableCell className="text-right text-red-600">{resultado.evadidos}</TableCell>
                  <TableCell className="text-right text-green-600">{resultado.retidos}</TableCell>
                  <TableCell className="text-right font-bold">{resultado.percentualRetencao.toFixed(1)}%</TableCell>
                  
                  {/* Comparação com período anterior */}
                  <TableCell className="text-right">
                    {resultado.comparacaoAnterior ? (
                      <div className="flex items-center justify-end">
                        <span className="mr-1">
                          {resultado.comparacaoAnterior.diferencaPercentual > 0 ? (
                            <ArrowUpIcon className="inline h-4 w-4 text-green-500" />
                          ) : resultado.comparacaoAnterior.diferencaPercentual < 0 ? (
                            <ArrowDownIcon className="inline h-4 w-4 text-red-500" />
                          ) : null}
                        </span>
                        <span className={resultado.comparacaoAnterior.diferencaPercentual > 0 
                          ? "text-green-600" 
                          : resultado.comparacaoAnterior.diferencaPercentual < 0 
                          ? "text-red-600" 
                          : ""
                        }>
                          {resultado.comparacaoAnterior.diferencaPercentual > 0 ? "+" : ""}
                          {resultado.comparacaoAnterior.diferencaPercentual}%
                        </span>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  
                  {/* Comparação com ano anterior */}
                  <TableCell className="text-right">
                    {resultado.comparacaoAnoAnterior ? (
                      <div className="flex items-center justify-end">
                        <span className="mr-1">
                          {resultado.comparacaoAnoAnterior.diferencaPercentual > 0 ? (
                            <ArrowUpIcon className="inline h-4 w-4 text-green-500" />
                          ) : resultado.comparacaoAnoAnterior.diferencaPercentual < 0 ? (
                            <ArrowDownIcon className="inline h-4 w-4 text-red-500" />
                          ) : null}
                        </span>
                        <span className={resultado.comparacaoAnoAnterior.diferencaPercentual > 0 
                          ? "text-green-600" 
                          : resultado.comparacaoAnoAnterior.diferencaPercentual < 0 
                          ? "text-red-600" 
                          : ""
                        }>
                          {resultado.comparacaoAnoAnterior.diferencaPercentual > 0 ? "+" : ""}
                          {resultado.comparacaoAnoAnterior.diferencaPercentual}%
                        </span>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
