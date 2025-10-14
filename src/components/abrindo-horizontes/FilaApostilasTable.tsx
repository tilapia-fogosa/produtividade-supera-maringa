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
import { ArrowUpDown, Calendar, CheckCircle, PackageCheck, Trash2 } from "lucide-react";
import { formatDateSaoPaulo, cn } from "@/lib/utils";
import { useApostilasRecolhidas, ApostilaRecolhida } from "@/hooks/use-apostilas-recolhidas";
import { useDeleteRecolhimento } from "@/hooks/use-delete-recolhimento";
import { CorrecaoAhModal } from "./CorrecaoAhModal";
import { EntregaAhModal } from "./EntregaAhModal";

type SortField = "pessoa_nome" | "turma_nome" | "apostila" | "data_recolhida" | "data_entrega";
type SortDirection = "asc" | "desc";

export const FilaApostilasTable = () => {
  const { data: apostilas, isLoading } = useApostilasRecolhidas();
  const { mutate: deleteRecolhimento } = useDeleteRecolhimento();
  
  const [filterPessoa, setFilterPessoa] = useState("");
  const [filterTurma, setFilterTurma] = useState("");
  const [filterApostila, setFilterApostila] = useState("");
  const [sortField, setSortField] = useState<SortField>("data_entrega");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  
  // Estado para os modais
  const [modalCorrecaoOpen, setModalCorrecaoOpen] = useState(false);
  const [modalEntregaOpen, setModalEntregaOpen] = useState(false);
  const [apostilaSelecionada, setApostilaSelecionada] = useState<ApostilaRecolhida | null>(null);

  const filteredAndSorted = useMemo(() => {
    if (!apostilas) return [];

    let result = apostilas.filter((apostila) => {
      const matchPessoa = apostila.pessoa_nome.toLowerCase().includes(filterPessoa.toLowerCase());
      const matchTurma = apostila.turma_nome.toLowerCase().includes(filterTurma.toLowerCase());
      const matchApostila = apostila.apostila.toLowerCase().includes(filterApostila.toLowerCase());
      
      return matchPessoa && matchTurma && matchApostila;
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
  }, [apostilas, filterPessoa, filterTurma, filterApostila, sortField, sortDirection]);

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

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja remover este recolhimento?")) {
      deleteRecolhimento(id);
    }
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
          <Button onClick={handleSortByEntrega} variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Ordenar por Entrega
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
            Nenhuma apostila recolhida encontrada
          </p>
        ) : (
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
                      <Calendar className="h-4 w-4 mr-2" />
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
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSorted.map((apostila) => (
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
                    <TableCell>
                      {formatDateSaoPaulo(apostila.data_recolhida, "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        "inline-block px-2 py-1 rounded",
                        getEntregaBackgroundColor(apostila)
                      )}>
                        <span className={getEntregaTextColor(apostila)}>
                          {formatDateSaoPaulo(apostila.data_entrega, "dd/MM/yyyy")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCorrecao(apostila)}
                        disabled={apostila.total_correcoes > 0}
                        className={cn(
                          apostila.total_correcoes > 0 && "bg-green-500/20 border-green-500 text-green-700 dark:text-green-400 hover:bg-green-500/30"
                        )}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Correção
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleEntrega(apostila)}
                        disabled={apostila.foi_entregue || apostila.total_correcoes === 0}
                      >
                        <PackageCheck className="h-4 w-4 mr-2" />
                        Entregar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(apostila.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
    </Card>
  );
};
