import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowUpDown, Calendar, CheckCircle, PackageCheck, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, Play, Users } from "lucide-react";
import { formatDateSaoPaulo, cn } from "@/lib/utils";
import { useApostilasRecolhidas, ApostilaRecolhida } from "@/hooks/use-apostilas-recolhidas";
import { useRemoverApostilaAcao } from "@/hooks/use-remover-apostila-acao";
import { useProfessores } from "@/hooks/use-professores";
import { IniciarCorrecaoAhModal } from "./IniciarCorrecaoAhModal";
import { FinalizarCorrecaoAhModal } from "./FinalizarCorrecaoAhModal";
import { EntregaAhModal } from "./EntregaAhModal";

type SortField = "pessoa_nome" | "turma_nome" | "apostila" | "data_entrega";
type SortDirection = "asc" | "desc";

export const FilaApostilasTable = () => {
  const { data: apostilas, isLoading } = useApostilasRecolhidas();
  const { removerAcao } = useRemoverApostilaAcao();
  const { professores } = useProfessores();
  
  const [filterPessoa, setFilterPessoa] = useState("");
  const [filterTurma, setFilterTurma] = useState("");
  const [filterApostila, setFilterApostila] = useState("");
  const [filtroProfessor, setFiltroProfessor] = useState<string>("todos");
  const [sortField, setSortField] = useState<SortField>("data_entrega");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [mostrarEntregues, setMostrarEntregues] = useState(false);
  const [mostrarCorrigidasNaoEntregues, setMostrarCorrigidasNaoEntregues] = useState(true);
  const [paginaAtual, setPaginaAtual] = useState(1);
  
  const ITENS_POR_PAGINA = 50;
  
  // Estado para os modais
  const [modalIniciarCorrecaoOpen, setModalIniciarCorrecaoOpen] = useState(false);
  const [modalFinalizarCorrecaoOpen, setModalFinalizarCorrecaoOpen] = useState(false);
  const [modalEntregaOpen, setModalEntregaOpen] = useState(false);
  const [modalRemoverOpen, setModalRemoverOpen] = useState(false);
  const [apostilaSelecionada, setApostilaSelecionada] = useState<ApostilaRecolhida | null>(null);
  const [mensagemRemover, setMensagemRemover] = useState("");

  const filteredAndSorted = useMemo(() => {
    if (!apostilas) return [];

    let result = apostilas.filter((apostila) => {
      const matchPessoa = apostila.pessoa_nome.toLowerCase().includes(filterPessoa.toLowerCase());
      const matchTurma = apostila.turma_nome.toLowerCase().includes(filterTurma.toLowerCase());
      const matchApostila = apostila.apostila.toLowerCase().includes(filterApostila.toLowerCase());
      const matchProfessor = filtroProfessor === "todos" || apostila.professor_id === filtroProfessor;
      const matchEntregue = mostrarEntregues ? true : !apostila.foi_entregue;
      const matchCorrigidaNaoEntregue = mostrarCorrigidasNaoEntregues 
        ? true 
        : !(apostila.total_correcoes > 0 && !apostila.foi_entregue);
      
      return matchPessoa && matchTurma && matchApostila && matchProfessor && matchEntregue && matchCorrigidaNaoEntregue;
    });

    result.sort((a, b) => {
      let aValue: string | number = a[sortField];
      let bValue: string | number = b[sortField];

      if (sortField === "data_entrega") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [apostilas, filterPessoa, filterTurma, filterApostila, filtroProfessor, sortField, sortDirection, mostrarEntregues, mostrarCorrigidasNaoEntregues]);

  // Cálculo de paginação
  const totalPaginas = Math.ceil(filteredAndSorted.length / ITENS_POR_PAGINA);
  const indiceInicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const indiceFim = indiceInicio + ITENS_POR_PAGINA;
  const apostilasPaginadas = filteredAndSorted.slice(indiceInicio, indiceFim);

  // Reset página quando filtros mudarem
  React.useEffect(() => {
    setPaginaAtual(1);
  }, [filterPessoa, filterTurma, filterApostila, filtroProfessor, mostrarEntregues, mostrarCorrigidasNaoEntregues]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSortByEntrega = () => {
    setSortField("data_entrega");
    setSortDirection("asc");
  };

  // Função para determinar a cor de fundo da célula de entrega
  const getEntregaBackgroundColor = (apostila: ApostilaRecolhida) => {
    // Se já foi entregue ou corrigida, sem destaque
    if (apostila.foi_entregue || apostila.total_correcoes > 0) {
      return "";
    }
    
    const hoje = new Date();
    const entrega = new Date(apostila.data_entrega);
    const diasRestantes = Math.ceil((entrega.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes <= 0) return "bg-red-100 dark:bg-red-950"; // Atrasada
    if (diasRestantes <= 3) return "bg-yellow-100 dark:bg-yellow-950"; // Próxima (3 dias)
    return "";
  };

  const getEntregaTextColor = (apostila: ApostilaRecolhida) => {
    const hoje = new Date();
    const entrega = new Date(apostila.data_entrega);
    const diasRestantes = Math.ceil((entrega.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes <= 0 && !apostila.foi_entregue && apostila.total_correcoes === 0) {
      return "text-destructive font-semibold";
    }
    if (diasRestantes <= 3 && diasRestantes >= 0 && !apostila.foi_entregue && apostila.total_correcoes === 0) {
      return "text-orange-600 dark:text-orange-400 font-semibold";
    }
    return "";
  };

  const handleIniciarCorrecao = (apostila: ApostilaRecolhida) => {
    setApostilaSelecionada(apostila);
    setModalIniciarCorrecaoOpen(true);
  };

  const handleFinalizarCorrecao = (apostila: ApostilaRecolhida) => {
    setApostilaSelecionada(apostila);
    setModalFinalizarCorrecaoOpen(true);
  };

  const handleEntrega = (apostila: ApostilaRecolhida) => {
    setApostilaSelecionada(apostila);
    setModalEntregaOpen(true);
  };

  const handleRemover = (apostila: ApostilaRecolhida) => {
    let mensagem = "";
    
    if (apostila.foi_entregue) {
      mensagem = `Tem certeza que deseja desfazer a entrega da apostila ${apostila.apostila} para ${apostila.pessoa_nome}?`;
    } else if (apostila.total_correcoes > 0) {
      mensagem = `Tem certeza que deseja remover a correção da apostila ${apostila.apostila} de ${apostila.pessoa_nome}?`;
    } else if (apostila.correcao_iniciada) {
      mensagem = `Tem certeza que deseja remover o início de correção da apostila ${apostila.apostila} de ${apostila.pessoa_nome}?`;
    } else {
      mensagem = `Tem certeza que deseja remover o recolhimento da apostila ${apostila.apostila} de ${apostila.pessoa_nome}?`;
    }
    
    setMensagemRemover(mensagem);
    setApostilaSelecionada(apostila);
    setModalRemoverOpen(true);
  };

  const confirmarRemover = () => {
    if (apostilaSelecionada) {
      removerAcao.mutate({
        apostilaRecolhidaId: apostilaSelecionada.id,
        foiEntregue: apostilaSelecionada.foi_entregue,
        totalCorrecoes: apostilaSelecionada.total_correcoes,
        correcaoIniciada: apostilaSelecionada.correcao_iniciada,
      });
    }
    setModalRemoverOpen(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Carregando apostilas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Apostilas Recolhidas</CardTitle>
            <div className="flex flex-col md:flex-row gap-2">
              <Button 
                onClick={() => setMostrarEntregues(!mostrarEntregues)} 
                variant="outline" 
                size="sm"
              >
                {mostrarEntregues ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {mostrarEntregues ? "Ocultar Entregues" : "Mostrar Entregues"}
              </Button>
              <Button 
                onClick={() => setMostrarCorrigidasNaoEntregues(!mostrarCorrigidasNaoEntregues)} 
                variant="outline" 
                size="sm"
              >
                {mostrarCorrigidasNaoEntregues ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {mostrarCorrigidasNaoEntregues ? "Ocultar Corrigidas" : "Mostrar Corrigidas"}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="filtro-pessoa">Buscar por pessoa</Label>
            <Input
              id="filtro-pessoa"
              placeholder="Digite o nome..."
              value={filterPessoa}
              onChange={(e) => setFilterPessoa(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="filtro-turma">Filtrar por turma</Label>
            <Input
              id="filtro-turma"
              placeholder="Digite a turma..."
              value={filterTurma}
              onChange={(e) => setFilterTurma(e.target.value)}
            />
          </div>
          
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
          
          <div className="space-y-2">
            <Label htmlFor="filtro-apostila">Filtrar por apostila</Label>
            <Input
              id="filtro-apostila"
              placeholder="Digite a apostila..."
              value={filterApostila}
              onChange={(e) => setFilterApostila(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredAndSorted.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {mostrarEntregues 
              ? "Nenhuma apostila recolhida encontrada" 
              : "Nenhuma apostila pendente encontrada"}
          </p>
        ) : (
          <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("pessoa_nome")}
                      className="h-8 px-2"
                    >
                      Pessoa
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("turma_nome")}
                      className="h-8 px-2"
                    >
                      Turma
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Professor</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("apostila")}
                      className="h-8 px-2"
                    >
                      Apostila
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Ex Corrigidos / Erros</TableHead>
                  <TableHead>Sendo corrigida por</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("data_entrega")}
                      className="h-8 px-2"
                    >
                      Previsão de Entrega
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right w-[280px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {apostilasPaginadas.map((apostila, index) => (
                    <TableRow key={apostila.id} className={index % 2 === 0 ? "bg-muted/30" : "bg-background"}>
                    <TableCell className="font-medium">{apostila.pessoa_nome}</TableCell>
                    <TableCell>{apostila.turma_nome}</TableCell>
                    <TableCell>{apostila.professor_nome || "Sem professor"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{apostila.apostila}</Badge>
                    </TableCell>
                    <TableCell>
                      {apostila.total_correcoes > 0 ? (
                        <span className="text-sm font-medium">
                          {apostila.exercicios_corrigidos || 0} / {apostila.erros || 0}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {apostila.correcao_iniciada && apostila.total_correcoes === 0 ? (
                        <div className="text-sm">
                          <span className="font-medium">{apostila.responsavel_correcao_nome}</span>
                          <br />
                          <span className="text-muted-foreground text-xs">({apostila.responsavel_correcao_tipo})</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-left">
                      <div className={cn(
                        "inline-block px-2 py-1 rounded",
                        getEntregaBackgroundColor(apostila)
                      )}>
                        <span className={getEntregaTextColor(apostila)}>
                          {formatDateSaoPaulo(apostila.data_entrega, "dd/MM/yyyy")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right w-[280px]">
                      <div className="flex gap-1.5 justify-end items-center">
                        {/* Estado 3: Corrigido */}
                        {apostila.total_correcoes > 0 ? (
                          <Badge 
                            variant="outline" 
                            className="h-8 w-[90px] px-2.5 text-xs rounded-lg bg-green-100 border-green-300 text-green-700 dark:bg-green-950 dark:border-green-700 dark:text-green-300 inline-flex items-center justify-center"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                            Corrigido
                          </Badge>
                        ) : apostila.correcao_iniciada ? (
                          /* Estado 2: Em correção - Botão Finalizar */
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFinalizarCorrecao(apostila)}
                            className="h-8 w-[90px] px-2.5 text-xs rounded-lg border-[#FF7C00]"
                            style={{ backgroundColor: '#FF7C00', color: 'white' }}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-white" />
                            Finalizar
                          </Button>
                        ) : (
                          /* Estado 1: Não iniciada - Botão Iniciar */
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleIniciarCorrecao(apostila)}
                            className="h-8 w-[90px] px-2.5 text-xs rounded-lg border-[#4E2CA3]"
                            style={{ backgroundColor: '#4E2CA3', color: 'white' }}
                          >
                            <Play className="h-3.5 w-3.5 mr-1.5 text-white" />
                            Iniciar
                          </Button>
                        )}
                        
                        {apostila.foi_entregue ? (
                          <Badge 
                            variant="outline" 
                            className="h-8 w-[90px] px-2.5 text-xs rounded-lg bg-green-100 border-green-300 text-green-700 dark:bg-green-950 dark:border-green-700 dark:text-green-300 inline-flex items-center justify-center"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                            Entregue
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEntrega(apostila)}
                            disabled={apostila.total_correcoes === 0}
                            className="h-8 w-[90px] px-2.5 text-xs rounded-lg border-[#FF7C00] disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-300"
                            style={apostila.total_correcoes > 0 ? { backgroundColor: '#FF7C00', color: 'white' } : undefined}
                          >
                            <PackageCheck className={`h-3.5 w-3.5 mr-1.5 ${apostila.total_correcoes > 0 ? 'text-white' : ''}`} />
                            Entregar
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemover(apostila)}
                          className="h-8 w-8 p-0 rounded-lg"
                          title={
                            apostila.foi_entregue
                              ? "Remover entrega"
                              : apostila.total_correcoes > 0
                              ? "Remover correção"
                              : apostila.correcao_iniciada
                              ? "Remover início de correção"
                              : "Remover recolhimento"
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {indiceInicio + 1} a {Math.min(indiceFim, filteredAndSorted.length)} de {filteredAndSorted.length} apostilas
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaAtual(paginaAtual - 1)}
                  disabled={paginaAtual === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-sm">
                  Página {paginaAtual} de {totalPaginas}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaAtual(paginaAtual + 1)}
                  disabled={paginaAtual === totalPaginas}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          </>
        )}
      </CardContent>

      {/* Modais */}
      {apostilaSelecionada && (
        <>
          <IniciarCorrecaoAhModal
            open={modalIniciarCorrecaoOpen}
            onOpenChange={setModalIniciarCorrecaoOpen}
            apostilaRecolhidaId={apostilaSelecionada.id}
            pessoaId={apostilaSelecionada.pessoa_id}
            pessoaNome={apostilaSelecionada.pessoa_nome}
            apostilaNome={apostilaSelecionada.apostila}
          />
          <FinalizarCorrecaoAhModal
            open={modalFinalizarCorrecaoOpen}
            onOpenChange={setModalFinalizarCorrecaoOpen}
            apostilaRecolhidaId={apostilaSelecionada.id}
            pessoaId={apostilaSelecionada.pessoa_id}
            pessoaNome={apostilaSelecionada.pessoa_nome}
            apostilaNome={apostilaSelecionada.apostila}
          />
          <EntregaAhModal
            open={modalEntregaOpen}
            onOpenChange={setModalEntregaOpen}
            apostilaRecolhidaId={apostilaSelecionada.id}
            apostilaNome={apostilaSelecionada.apostila}
            pessoaNome={apostilaSelecionada.pessoa_nome}
          />
        </>
      )}

      {/* Modal de Confirmação de Remoção */}
      <AlertDialog open={modalRemoverOpen} onOpenChange={setModalRemoverOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>
              {mensagemRemover}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarRemover}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
