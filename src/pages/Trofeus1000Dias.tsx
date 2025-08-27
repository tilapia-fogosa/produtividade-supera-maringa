import { useState } from "react";
import { useTrofeus1000Dias, FiltrosTrofeus } from "@/hooks/use-trofeus-1000-dias";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal, Gift, CheckCircle, XCircle, Filter, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Trofeus1000Dias() {
  const { 
    alunos, 
    loading, 
    error, 
    filtros, 
    setFiltros, 
    atualizarTrofeu, 
    limparFiltros,
    refetch 
  } = useTrofeus1000Dias();

  const [showFilters, setShowFilters] = useState(false);

  const handleFiltroChange = (campo: keyof FiltrosTrofeus, valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor as 'todos' | 'sim' | 'nao'
    }));
  };

  const handleCheckboxChange = (alunoId: string, campo: 'trofeu_pedido' | 'trofeu_confeccionado' | 'trofeu_entregue', checked: boolean) => {
    atualizarTrofeu(alunoId, campo, checked);
  };

  const getStatusIcon = (status: boolean) => {
    return status ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-muted-foreground" />;
  };

  const getDiasSupera = (dias: number | null) => {
    if (!dias) return "N/A";
    
    if (dias > 2000) {
      return (
        <Badge variant="default" className="bg-[hsl(var(--trophy-orange))] text-white">
          <Trophy className="h-3 w-3 mr-1" />
          {dias} dias
        </Badge>
      );
    } else if (dias >= 1000) {
      return (
        <Badge variant="default" className="bg-[hsl(var(--trophy-purple))] text-white">
          <Trophy className="h-3 w-3 mr-1" />
          {dias} dias
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-background text-foreground">
          {dias} dias
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-4 px-2">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h1 className="text-2xl font-bold">Troféus de 1000 Dias</h1>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-4 px-2">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h1 className="text-2xl font-bold">Troféus de 1000 Dias</h1>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button onClick={refetch} className="mt-4">
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <h1 className="text-2xl font-bold">Troféus de 1000 Dias</h1>
          <Badge variant="secondary">{alunos.length} alunos</Badge>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              limparFiltros();
              setShowFilters(false);
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Troféu Pedido
                </label>
                <Select
                  value={filtros.trofeuPedido}
                  onValueChange={(value) => handleFiltroChange('trofeuPedido', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Troféu Confeccionado
                </label>
                <Select
                  value={filtros.trofeuConfeccionado}
                  onValueChange={(value) => handleFiltroChange('trofeuConfeccionado', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Troféu Entregue
                </label>
                <Select
                  value={filtros.trofeuEntregue}
                  onValueChange={(value) => handleFiltroChange('trofeuEntregue', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Aluno</TableHead>
                  <TableHead className="w-[120px]">Dias no Supera</TableHead>
                  <TableHead className="w-[150px]">Turma</TableHead>
                  <TableHead className="w-[150px]">Professor</TableHead>
                  <TableHead className="w-[120px] text-center">Pedido</TableHead>
                  <TableHead className="w-[120px] text-center">Confeccionado</TableHead>
                  <TableHead className="w-[120px] text-center">Entregue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Gift className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          Nenhum aluno encontrado com os filtros aplicados
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  alunos.map((aluno) => (
                    <TableRow key={aluno.id}>
                      <TableCell className="font-medium">
                        {aluno.nome}
                      </TableCell>
                      <TableCell>
                        {getDiasSupera(aluno.dias_supera)}
                      </TableCell>
                      <TableCell>
                        {aluno.turma_nome || "-"}
                      </TableCell>
                      <TableCell>
                        {aluno.professor_nome || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(aluno.trofeu_pedido)}
                          <Checkbox
                            checked={aluno.trofeu_pedido}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(aluno.id, 'trofeu_pedido', !!checked)
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(aluno.trofeu_confeccionado)}
                          <Checkbox
                            checked={aluno.trofeu_confeccionado}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(aluno.id, 'trofeu_confeccionado', !!checked)
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(aluno.trofeu_entregue)}
                          <Checkbox
                            checked={aluno.trofeu_entregue}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(aluno.id, 'trofeu_entregue', !!checked)
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}