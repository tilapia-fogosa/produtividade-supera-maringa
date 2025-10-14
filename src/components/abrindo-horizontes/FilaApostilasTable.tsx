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
import { ArrowUpDown, Calendar } from "lucide-react";
import { formatDateSaoPaulo } from "@/lib/utils";
import { useApostilasRecolhidas, ApostilaRecolhida } from "@/hooks/use-apostilas-recolhidas";

type SortField = "pessoa_nome" | "turma_nome" | "apostila" | "data_recolhida" | "data_entrega";
type SortDirection = "asc" | "desc";

export const FilaApostilasTable = () => {
  const { data: apostilas, isLoading } = useApostilasRecolhidas();
  
  const [filterPessoa, setFilterPessoa] = useState("");
  const [filterTurma, setFilterTurma] = useState("");
  const [filterApostila, setFilterApostila] = useState("");
  const [sortField, setSortField] = useState<SortField>("data_entrega");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

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

  const isEntregaProxima = (dataEntrega: string) => {
    const hoje = new Date();
    const entrega = new Date(dataEntrega);
    const diasRestantes = Math.ceil((entrega.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diasRestantes <= 3 && diasRestantes >= 0;
  };

  const isEntregaAtrasada = (dataEntrega: string) => {
    const hoje = new Date();
    const entrega = new Date(dataEntrega);
    return entrega < hoje;
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
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("data_recolhida")}
                      className="h-8 px-2"
                    >
                      Data Recolhida
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
                      Data Entrega
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
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
                      {formatDateSaoPaulo(apostila.data_recolhida, "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          isEntregaAtrasada(apostila.data_entrega)
                            ? "text-destructive font-semibold"
                            : isEntregaProxima(apostila.data_entrega)
                            ? "text-orange-600 font-semibold"
                            : ""
                        }
                      >
                        {formatDateSaoPaulo(apostila.data_entrega, "dd/MM/yyyy")}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
