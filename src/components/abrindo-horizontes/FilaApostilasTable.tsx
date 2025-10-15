import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { ArrowUpDown, Calendar, CheckCircle, PackageCheck, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateSaoPaulo, cn } from "@/lib/utils";
import { useApostilasRecolhidas, ApostilaRecolhida } from "@/hooks/use-apostilas-recolhidas";
import { useRemoverApostilaAcao } from "@/hooks/use-remover-apostila-acao";
import { CorrecaoAhModal } from "./CorrecaoAhModal";
import { EntregaAhModal } from "./EntregaAhModal";

type SortField = "pessoa_nome" | "turma_nome" | "apostila" | "data_recolhida" | "data_entrega";
type SortDirection = "asc" | "desc";

export const FilaApostilasTable = () => {
  const { data: apostilas, isLoading } = useApostilasRecolhidas();
  const { removerAcao } = useRemoverApostilaAcao();
  
  const [filterPessoa, setFilterPessoa] = useState("");
  const [filterTurma, setFilterTurma] = useState("");
  const [filterApostila, setFilterApostila] = useState("");
  const [sortField, setSortField] = useState<SortField>("data_entrega");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [mostrarEntregues, setMostrarEntregues] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  
  const ITENS_POR_PAGINA = 50;
  
  // Estado para os modais
  const [modalCorrecaoOpen, setModalCorrecaoOpen] = useState(false);
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
      const matchEntregue = mostrarEntregues ? true : !apostila.foi_entregue;
      
      return matchPessoa && matchTurma && matchApostila && matchEntregue;
    });

    result.sort((a, b) => {
      let aValue: string | number = a[sortField];
      let bValue: string | number = b[sortField];

      if (sortField === "data_recolhida" || sortField === "data_entrega") {
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
  }, [apostilas, filterPessoa, filterTurma, filterApostila, sortField, sortDirection, mostrarEntregues]);

  // Cálculo de paginação
  const totalPaginas = Math.ceil(filteredAndSorted.length / ITENS_POR_PAGINA);
  const indiceInicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const indiceFim = indiceInicio + ITENS_POR_PAGINA;
  const apostilasPaginadas = filteredAndSorted.slice(indiceInicio, indiceFim);

  // Reset página quando filtros mudarem
  React.useEffect(() => {
    setPaginaAtual(1);
  }, [filterPessoa, filterTurma, filterApostila, mostrarEntregues]);

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

  const handleCorrecao = (apostila: ApostilaRecolhida) => {
    setApostilaSelecionada(apostila);
    setModalCorrecaoOpen(true);
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Apostilas Recolhidas</CardTitle>
          <Button 
            onClick={() => setMostrarEntregues(!mostrarEntregues)} 
            variant="outline" 
            size="sm"
          >
            {mostrarEntregues ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {mostrarEntregues ? "Ocultar Entregues" : "Mostrar Entregues"}
          </Button>
        </div>
        
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Input
            placeholder="Filtrar por pessoa..."
            value={filterPessoa}
            onChange={(e) => setFilterPessoa(e.target.value)}
          />
          <Input
            placeholder="Filtrar por turma..."
            value={filterTurma}
            onChange={(e) => setFilterTurma(e.target.value)}
          />
          <Input
            placeholder="Filtrar por apostila..."
            value={filterApostila}
            onChange={(e) => setFilterApostila(e.target.value)}
          />
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
                  <TableHead>Correções</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("data_recolhida")}
                      className="h-8 px-2"
                    >
                      Recolhida
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
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
                {apostilasPaginadas.map((apostila) => (
                  <TableRow key={apostila.id}>
                    <TableCell className="font-medium">{apostila.pessoa_nome}</TableCell>
                    <TableCell>{apostila.turma_nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{apostila.apostila}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={apostila.total_correcoes > 0 ? "default" : "outline"}>
                        {apostila.total_correcoes} {apostila.total_correcoes === 1 ? "correção" : "correções"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left">
                      {formatDateSaoPaulo(apostila.data_recolhida, "dd/MM/yyyy")}
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
                        {apostila.total_correcoes > 0 ? (
                          <Badge 
                            variant="outline" 
                            className="h-8 w-[90px] px-2.5 text-xs rounded-lg bg-green-100 border-green-300 text-green-700 dark:bg-green-950 dark:border-green-700 dark:text-green-300 inline-flex items-center justify-center"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                            Corrigido
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCorrecao(apostila)}
                            className="h-8 w-[90px] px-2.5 text-xs rounded-lg bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200 dark:bg-purple-950 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                            Correção
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
                            className="h-8 w-[90px] px-2.5 text-xs rounded-lg bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200 disabled:opacity-50 dark:bg-orange-950 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
                          >
                            <PackageCheck className="h-3.5 w-3.5 mr-1.5" />
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

      {/* Modal de Correção */}
      {apostilaSelecionada && (
        <>
          <CorrecaoAhModal
            open={modalCorrecaoOpen}
            onOpenChange={setModalCorrecaoOpen}
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
