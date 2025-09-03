import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useResultadosMensaisRetencao } from "@/hooks/use-resultados-mensais-retencao";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ResultadosMensais() {
  const { data: resultados, isLoading, error } = useResultadosMensaisRetencao();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  // Filtrar resultados
  const resultadosFiltrados = resultados?.filter((resultado) => {
    const matchesSearch = resultado.aluno_nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || 
      (statusFilter === "ativos" && resultado.aluno_ativo) ||
      (statusFilter === "inativos" && !resultado.aluno_ativo) ||
      (statusFilter === "com-alertas" && resultado.total_alertas > 0) ||
      (statusFilter === "com-retencoes" && resultado.total_retencoes > 0);
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Calcular estatísticas
  const stats = resultados ? {
    totalAlunos: resultados.length,
    alunosAtivos: resultados.filter(r => r.aluno_ativo).length,
    alunosInativos: resultados.filter(r => !r.aluno_ativo).length,
    mediaDiasAlertas: Math.round(
      resultados
        .filter(r => r.dias_desde_primeiro_alerta !== null)
        .reduce((acc, r) => acc + (r.dias_desde_primeiro_alerta || 0), 0) /
      resultados.filter(r => r.dias_desde_primeiro_alerta !== null).length || 1
    ),
    mediaDiasRetencoes: Math.round(
      resultados
        .filter(r => r.dias_desde_primeira_retencao !== null)
        .reduce((acc, r) => acc + (r.dias_desde_primeira_retencao || 0), 0) /
      resultados.filter(r => r.dias_desde_primeira_retencao !== null).length || 1
    ),
  } : null;

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
              <p>Erro ao carregar os resultados mensais</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resultados Mensais de Retenção</h1>
          <p className="text-muted-foreground">
            Análise de tempo desde primeiros alertas e retenções
          </p>
        </div>
      </div>

      {/* Cards de estatísticas */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total de Alunos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalAlunos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Alunos Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.alunosAtivos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Alunos Inativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.alunosInativos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                Média Dias Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {isNaN(stats.mediaDiasAlertas) ? "N/A" : `${stats.mediaDiasAlertas}d`}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Média Dias Retenções
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {isNaN(stats.mediaDiasRetencoes) ? "N/A" : `${stats.mediaDiasRetencoes}d`}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome do aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativos">Ativos</SelectItem>
                <SelectItem value="inativos">Inativos</SelectItem>
                <SelectItem value="com-alertas">Com Alertas</SelectItem>
                <SelectItem value="com-retencoes">Com Retenções</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de resultados */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Primeiro Alerta</TableHead>
                    <TableHead>Dias desde Alerta</TableHead>
                    <TableHead>Primeira Retenção</TableHead>
                    <TableHead>Dias desde Retenção</TableHead>
                    <TableHead>Total Alertas</TableHead>
                    <TableHead>Total Retenções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultadosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm || statusFilter !== "todos" 
                            ? "Nenhum resultado encontrado com os filtros aplicados"
                            : "Nenhum aluno com alertas ou retenções encontrado"
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    resultadosFiltrados.map((resultado) => (
                      <TableRow key={resultado.aluno_id}>
                        <TableCell className="font-medium">{resultado.aluno_nome}</TableCell>
                        <TableCell>{resultado.turma_nome}</TableCell>
                        <TableCell>{resultado.professor_nome}</TableCell>
                        <TableCell>
                          <Badge variant={resultado.aluno_ativo ? "default" : "secondary"}>
                            {resultado.aluno_ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {resultado.primeiro_alerta 
                            ? format(new Date(resultado.primeiro_alerta), "dd/MM/yyyy", { locale: ptBR })
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          {resultado.dias_desde_primeiro_alerta !== null 
                            ? `${resultado.dias_desde_primeiro_alerta} dias`
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          {resultado.primeira_retencao 
                            ? format(new Date(resultado.primeira_retencao), "dd/MM/yyyy", { locale: ptBR })
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          {resultado.dias_desde_primeira_retencao !== null 
                            ? `${resultado.dias_desde_primeira_retencao} dias`
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{resultado.total_alertas}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{resultado.total_retencoes}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}