import { useCamisetas } from "@/hooks/use-camisetas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shirt, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Camisetas() {
  const { 
    alunos, 
    contadorCamisetasNaoEntregues,
    loading, 
    error, 
    atualizarCamiseta, 
    refetch 
  } = useCamisetas();

  const handleCheckboxChange = (alunoId: string, checked: boolean) => {
    atualizarCamiseta(alunoId, checked);
  };

  const getStatusIcon = (status: boolean) => {
    return status ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-muted-foreground" />;
  };

  const getDiasSupera = (dias: number | null) => {
    if (!dias) return "N/A";
    
    if (dias >= 90) {
      return (
        <Badge variant="default" className="bg-blue-600 text-white">
          <Shirt className="h-3 w-3 mr-1" />
          {dias} dias
        </Badge>
      );
    } else if (dias >= 60) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
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
            <Shirt className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Controle de Camisetas</h1>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[100px]" />
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
            <Shirt className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Controle de Camisetas</h1>
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
        <div className="flex items-center gap-3 flex-wrap">
          <Shirt className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Controle de Camisetas</h1>
          <Badge variant="secondary">{alunos.length} alunos elegíveis</Badge>
          <Badge variant="destructive" className="bg-blue-600 text-white">
            {contadorCamisetasNaoEntregues} pendentes (+90 dias)
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shirt className="h-5 w-5" />
            Critérios de Elegibilidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">60+ dias</Badge>
              <span>Alunos elegíveis para camiseta (2+ meses no Supera)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-600 text-white">
                <Shirt className="h-3 w-3 mr-1" />
                90+ dias
              </Badge>
              <span>Alunos prioritários (3+ meses no Supera)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Aluno</TableHead>
                  <TableHead className="w-[120px]">Tempo no Supera</TableHead>
                  <TableHead className="w-[150px]">Turma</TableHead>
                  <TableHead className="w-[150px]">Professor</TableHead>
                  <TableHead className="w-[120px] text-center">Camiseta Entregue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Shirt className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          Nenhum aluno encontrado com mais de 60 dias no Supera
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
                          {getStatusIcon(aluno.camiseta_entregue)}
                          <Checkbox
                            checked={aluno.camiseta_entregue}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(aluno.id, !!checked)
                            }
                            className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
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