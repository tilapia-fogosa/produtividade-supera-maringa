
import React from 'react';
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCorrecoesAHStats } from '@/hooks/use-correcoes-ah-stats';
import { BookText, TrendingUp } from 'lucide-react';

const CorrecoesAbrindoHorizontes = () => {
  const { data: stats, isLoading, error } = useCorrecoesAHStats();

  if (isLoading) {
    return (
      <div className="container mx-auto py-4 px-2">
        <div className="flex justify-center items-center p-8">
          <p className="text-azul-500">Carregando estatísticas de correções...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-4 px-2">
        <div className="flex justify-center items-center p-8">
          <p className="text-red-500">Erro ao carregar estatísticas: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-2">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <BookText className="h-6 w-6 text-azul-500" />
          <h1 className="text-2xl font-bold text-azul-500">Correções Abrindo Horizontes</h1>
        </div>
        <p className="text-sm text-gray-600">
          Estatísticas de exercícios corrigidos pelos professores em diferentes períodos
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-azul-50 to-orange-50 border-b">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-azul-500" />
            <h2 className="text-lg font-semibold text-azul-600">
              Ranking de Correções por Professor
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-azul-600">Professor</TableHead>
                <TableHead className="text-center font-semibold text-azul-600">Mês Atual</TableHead>
                <TableHead className="text-center font-semibold text-azul-600">Mês Anterior</TableHead>
                <TableHead className="text-center font-semibold text-azul-600">Últ. 3 Meses</TableHead>
                <TableHead className="text-center font-semibold text-azul-600">Últ. 6 Meses</TableHead>
                <TableHead className="text-center font-semibold text-azul-600">Últ. 12 Meses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats && stats.length > 0 ? (
                stats.map((stat, index) => (
                  <TableRow key={stat.professor_correcao} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <TableCell className="font-medium text-azul-700">
                      <div className="flex items-center gap-2">
                        <BookText className="h-4 w-4 text-azul-400" />
                        {stat.professor_correcao}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                        stat.mes_atual > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {stat.mes_atual}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                        stat.mes_anterior > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {stat.mes_anterior}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        {stat.ultimos_3_meses}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                        {stat.ultimos_6_meses}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="px-2 py-1 bg-azul-100 text-azul-800 rounded-full text-sm font-medium">
                        {stat.ultimos_12_meses}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Nenhuma correção encontrada nos últimos 12 meses
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {stats && stats.length > 0 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="text-center">
              <p className="text-sm text-green-600 font-medium">Total de Professores</p>
              <p className="text-2xl font-bold text-green-800">{stats.length}</p>
            </div>
          </Card>
          
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="text-center">
              <p className="text-sm text-blue-600 font-medium">Correções Mês Atual</p>
              <p className="text-2xl font-bold text-blue-800">
                {stats.reduce((total, stat) => total + stat.mes_atual, 0)}
              </p>
            </div>
          </Card>
          
          <Card className="p-4 bg-azul-50 border-azul-200">
            <div className="text-center">
              <p className="text-sm text-azul-600 font-medium">Total Últimos 12 Meses</p>
              <p className="text-2xl font-bold text-azul-800">
                {stats.reduce((total, stat) => total + stat.ultimos_12_meses, 0)}
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CorrecoesAbrindoHorizontes;
