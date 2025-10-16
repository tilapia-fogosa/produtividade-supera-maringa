import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProximasColetasAH } from "@/hooks/use-proximas-coletas-ah";
import { useAlunosIgnoradosAH } from "@/hooks/use-alunos-ignorados-ah";
import { useRemoverIgnorarColetaAH } from "@/hooks/use-remover-ignorar-coleta-ah";
import { useProfessores } from "@/hooks/use-professores";
import { useTodasTurmas } from "@/hooks/use-todas-turmas";
import { Calendar, Clock, Search, Users, GraduationCap, EyeOff, Eye, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { IgnorarColetaModal } from "./IgnorarColetaModal";

export const ProximasColetasAH = () => {
  const { data: pessoas, isLoading } = useProximasColetasAH();
  const { data: ignorados, isLoading: isLoadingIgnorados } = useAlunosIgnoradosAH();
  const { mutate: removerIgnorar } = useRemoverIgnorarColetaAH();
  const { professores } = useProfessores();
  const { turmas } = useTodasTurmas();

  // Estados dos filtros
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroProfessor, setFiltroProfessor] = useState<string>("todos");
  const [filtroTurma, setFiltroTurma] = useState<string>("todos");
  
  // Estado do modal de ignorar
  const [modalIgnorarOpen, setModalIgnorarOpen] = useState(false);
  const [pessoaSelecionada, setPessoaSelecionada] = useState<{ id: string; nome: string } | null>(null);

  // Aplicar filtros
  const pessoasFiltradas = useMemo(() => {
    if (!pessoas) return [];
    
    return pessoas.filter(pessoa => {
      // Filtro por nome (case insensitive)
      const matchNome = pessoa.nome
        .toLowerCase()
        .includes(filtroNome.toLowerCase());
      
      // Filtro por professor
      const matchProfessor = 
        filtroProfessor === "todos" || 
        pessoa.professor_id === filtroProfessor;
      
      // Filtro por turma
      const matchTurma = 
        filtroTurma === "todos" || 
        pessoa.turma_id === filtroTurma;
      
      return matchNome && matchProfessor && matchTurma;
    });
  }, [pessoas, filtroNome, filtroProfessor, filtroTurma]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!pessoas || pessoas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximas Coletas
          </CardTitle>
          <CardDescription>
            Nenhum dado disponível no momento
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const hasFiltrosAtivos = filtroNome || filtroProfessor !== "todos" || filtroTurma !== "todos";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Próximas Coletas
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="coletas" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="coletas" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próximas Coletas
              {pessoasFiltradas.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-primary-foreground">
                  {pessoasFiltradas.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ignorados" className="flex items-center gap-2">
              <EyeOff className="h-4 w-4" />
              Ignorados
              {ignorados && ignorados.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-primary-foreground">
                  {ignorados.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Aba de Próximas Coletas */}
          <TabsContent value="coletas" className="space-y-4">
            <CardDescription>
              Todos os alunos e funcionários ativos ordenados por tempo sem correção AH
            </CardDescription>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro por Nome */}
              <div className="space-y-2">
                <Label htmlFor="filtro-nome" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Buscar por nome
                </Label>
                <Input
                  id="filtro-nome"
                  placeholder="Digite o nome..."
                  value={filtroNome}
                  onChange={(e) => setFiltroNome(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Filtro por Professor */}
              <div className="space-y-2">
                <Label htmlFor="filtro-professor" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Filtrar por professor
                </Label>
                <Select value={filtroProfessor} onValueChange={setFiltroProfessor}>
                  <SelectTrigger id="filtro-professor">
                    <SelectValue placeholder="Todos os professores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os professores</SelectItem>
                    {professores.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Turma */}
              <div className="space-y-2">
                <Label htmlFor="filtro-turma" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Filtrar por turma
                </Label>
                <Select value={filtroTurma} onValueChange={setFiltroTurma}>
                  <SelectTrigger id="filtro-turma">
                    <SelectValue placeholder="Todas as turmas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as turmas</SelectItem>
                    {turmas.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {pessoasFiltradas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {hasFiltrosAtivos 
                  ? "Nenhuma pessoa encontrada com os filtros aplicados" 
                  : "Nenhum dado disponível"
                }
              </p>
            ) : (
              <div className="max-h-[600px] overflow-auto">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="w-[100px]">Tipo</TableHead>
                        <TableHead>Turma</TableHead>
                        <TableHead>Professor</TableHead>
                        <TableHead>Última Correção</TableHead>
                        <TableHead className="text-right">Dias sem correção</TableHead>
                        <TableHead className="w-[80px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pessoasFiltradas.map((pessoa, index) => (
                        <TableRow key={pessoa.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="font-medium">{pessoa.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {pessoa.origem === 'aluno' ? 'Aluno' : 'Funcionário'}
                            </Badge>
                          </TableCell>
                          <TableCell>{pessoa.turma_nome || '-'}</TableCell>
                          <TableCell>{pessoa.professor_nome || '-'}</TableCell>
                          <TableCell>
                            {pessoa.ultima_correcao_ah ? (
                              <span className="text-sm">
                                {format(new Date(pessoa.ultima_correcao_ah), "dd/MM/yyyy")}
                              </span>
                            ) : (
                              <Badge variant="secondary">Sem registro</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {pessoa.dias_desde_ultima_correcao ? (
                              <span className="font-medium">
                                {pessoa.dias_desde_ultima_correcao} {pessoa.dias_desde_ultima_correcao === 1 ? 'dia' : 'dias'}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {pessoa.origem === 'aluno' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setPessoaSelecionada({ id: pessoa.id, nome: pessoa.nome });
                                  setModalIgnorarOpen(true);
                                }}
                                title="Ignorar temporariamente"
                              >
                                <EyeOff className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Aba de Ignorados */}
          <TabsContent value="ignorados" className="space-y-4">
            <CardDescription>
              Alunos temporariamente ignorados da lista de coletas
            </CardDescription>

            {isLoadingIgnorados ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : !ignorados || ignorados.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum aluno ignorado no momento
              </p>
            ) : (
              <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2">
                {ignorados.map((ignorado) => (
                  <div
                    key={ignorado.id}
                    className="p-4 rounded-lg border bg-card space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{ignorado.nome_pessoa}</p>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {ignorado.pessoa_tipo === 'aluno' ? 'Aluno' : 'Funcionário'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {ignorado.turma_nome || 'Sem turma'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="flex-shrink-0 text-primary-foreground">
                          {ignorado.dias_restantes} {ignorado.dias_restantes === 1 ? 'dia restante' : 'dias restantes'}
                        </Badge>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 rounded-sm"
                          onClick={() => removerIgnorar(ignorado.id)}
                          title="Remover da lista de ignorados"
                        >
                          <X className="h-4 w-4 text-white" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="font-medium min-w-[100px]">Motivo:</span>
                        <span className="text-muted-foreground">{ignorado.motivo}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium min-w-[100px]">Responsável:</span>
                        <span className="text-muted-foreground">{ignorado.responsavel}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium min-w-[100px]">Período:</span>
                        <span className="text-muted-foreground">
                          {format(new Date(ignorado.data_inicio), "dd/MM/yyyy", { locale: ptBR })} até{' '}
                          {format(new Date(ignorado.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {pessoaSelecionada && (
          <IgnorarColetaModal
            open={modalIgnorarOpen}
            onOpenChange={setModalIgnorarOpen}
            pessoaId={pessoaSelecionada.id}
            pessoaNome={pessoaSelecionada.nome}
          />
        )}
      </CardContent>
    </Card>
  );
};
