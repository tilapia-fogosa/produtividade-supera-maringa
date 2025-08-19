
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Eye, MessageCircle, Save } from "lucide-react";
import { useAlunosAtivos, AlunoAtivo } from '@/hooks/use-alunos-ativos';
import { DetalhesAlunoAtivoModal } from '@/components/alunos/DetalhesAlunoAtivoModal';

type SortField = 'nome' | 'turma' | 'professor' | 'apostila' | 'dias_supera';
type SortDirection = 'asc' | 'desc';

export default function AlunosAtivos() {
  const {
    alunos,
    loading,
    error,
    atualizarWhatsApp
  } = useAlunosAtivos();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTurma, setFilterTurma] = useState('todas');
  const [filterProfessor, setFilterProfessor] = useState('todos');
  const [filterApostila, setFilterApostila] = useState('todas');
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoAtivo | null>(null);
  const [editandoWhatsApp, setEditandoWhatsApp] = useState<string | null>(null);
  const [whatsappTemp, setWhatsappTemp] = useState('');
  const [salvandoWhatsApp, setSalvandoWhatsApp] = useState<string | null>(null);

  // Extrair valores únicos para os filtros
  const turmasUnicas = useMemo(() => {
    return Array.from(new Set(alunos.map(aluno => aluno.turma_nome).filter(Boolean)));
  }, [alunos]);
  const professoresUnicos = useMemo(() => {
    return Array.from(new Set(alunos.map(aluno => aluno.professor_nome).filter(Boolean)));
  }, [alunos]);
  const apostilasUnicas = useMemo(() => {
    return Array.from(new Set(alunos.map(aluno => aluno.ultima_apostila).filter(Boolean)));
  }, [alunos]);

  // Filtrar e ordenar alunos
  const alunosFiltrados = useMemo(() => {
    let resultado = alunos.filter(aluno => {
      const matchSearch = aluno.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTurma = filterTurma === 'todas' || aluno.turma_nome === filterTurma;
      const matchProfessor = filterProfessor === 'todos' || aluno.professor_nome === filterProfessor;
      const matchApostila = filterApostila === 'todas' || aluno.ultima_apostila === filterApostila;
      return matchSearch && matchTurma && matchProfessor && matchApostila;
    });

    // Ordenar
    resultado.sort((a, b) => {
      let valueA: string | number = '';
      let valueB: string | number = '';
      switch (sortField) {
        case 'nome':
          valueA = a.nome || '';
          valueB = b.nome || '';
          break;
        case 'turma':
          valueA = a.turma_nome || '';
          valueB = b.turma_nome || '';
          break;
        case 'professor':
          valueA = a.professor_nome || '';
          valueB = b.professor_nome || '';
          break;
        case 'apostila':
          valueA = a.ultima_apostila || '';
          valueB = b.ultima_apostila || '';
          break;
        case 'dias_supera':
          valueA = a.dias_supera || 0;
          valueB = b.dias_supera || 0;
          break;
      }
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      } else {
        return sortDirection === 'asc' ? (valueA as number) - (valueB as number) : (valueB as number) - (valueA as number);
      }
    });
    return resultado;
  }, [alunos, searchTerm, filterTurma, filterProfessor, filterApostila, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterTurma('todas');
    setFilterProfessor('todos');
    setFilterApostila('todas');
  };

  const handleVerDetalhes = (aluno: AlunoAtivo) => {
    setAlunoSelecionado(aluno);
  };

  const handleFecharModal = () => {
    setAlunoSelecionado(null);
  };

  const handleEditarWhatsApp = (aluno: AlunoAtivo) => {
    setEditandoWhatsApp(aluno.id);
    setWhatsappTemp(aluno.whatapp_contato || '');
  };

  const handleSalvarWhatsApp = async (alunoId: string) => {
    setSalvandoWhatsApp(alunoId);
    const sucesso = await atualizarWhatsApp(alunoId, whatsappTemp);
    if (sucesso) {
      setEditandoWhatsApp(null);
    }
    setSalvandoWhatsApp(null);
  };

  const handleCancelarEdicao = () => {
    setEditandoWhatsApp(null);
    setWhatsappTemp('');
  };

  if (loading) {
    return <div className="p-4 text-center">
        <p>Carregando alunos ativos...</p>
      </div>;
  }
  if (error) {
    return <div className="p-4 text-center text-red-600">
        <p>Erro ao carregar alunos: {error}</p>
      </div>;
  }
  
  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Alunos Ativos</h1>
        <Badge variant="secondary" className="text-sm bg-purple-400">
          {alunosFiltrados.length} de {alunos.length} alunos
        </Badge>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca por nome */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="Buscar por nome do aluno..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>

          {/* Filtros por seleção */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={filterTurma} onValueChange={setFilterTurma}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as turmas</SelectItem>
                {turmasUnicas.map(turma => <SelectItem key={turma} value={turma}>{turma}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterProfessor} onValueChange={setFilterProfessor}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por professor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os professores</SelectItem>
                {professoresUnicos.map(professor => <SelectItem key={professor} value={professor}>{professor}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterApostila} onValueChange={setFilterApostila}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por apostila" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as apostilas</SelectItem>
                {apostilasUnicas.map(apostila => <SelectItem key={apostila} value={apostila}>{apostila}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={clearFilters} className="w-full md:w-auto">
            Limpar Filtros
          </Button>
        </CardContent>
      </Card>

      {/* Lista de alunos */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4">
                    <Button variant="ghost" onClick={() => handleSort('nome')} className="font-semibold hover:bg-gray-100">
                      Nome
                      {getSortIcon('nome')}
                    </Button>
                  </th>
                  <th className="text-left p-4">
                    <Button variant="ghost" onClick={() => handleSort('turma')} className="font-semibold hover:bg-gray-100">
                      Turma
                      {getSortIcon('turma')}
                    </Button>
                  </th>
                  <th className="text-left p-4">
                    <Button variant="ghost" onClick={() => handleSort('professor')} className="font-semibold hover:bg-gray-100">
                      Professor
                      {getSortIcon('professor')}
                    </Button>
                  </th>
                  <th className="text-left p-4">
                    <Button variant="ghost" onClick={() => handleSort('apostila')} className="font-semibold hover:bg-gray-100">
                      Apostila Atual
                      {getSortIcon('apostila')}
                    </Button>
                  </th>
                  <th className="text-left p-4">
                    <Button variant="ghost" onClick={() => handleSort('dias_supera')} className="font-semibold hover:bg-gray-100">
                      Dias no Supera
                      {getSortIcon('dias_supera')}
                    </Button>
                  </th>
                  <th className="text-left p-4 w-[180px]">
                    <span className="font-semibold flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </span>
                  </th>
                  <th className="text-left p-4 w-[120px]">
                    <span className="font-semibold">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {alunosFiltrados.map(aluno => (
                  <tr key={aluno.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{aluno.nome}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {aluno.turma_nome || 'Sem turma'}
                      </Badge>
                    </td>
                    <td className="p-4">{aluno.professor_nome || 'Não atribuído'}</td>
                    <td className="p-4">
                      {aluno.ultima_apostila ? (
                        <Badge variant="secondary" className="bg-violet-400">{aluno.ultima_apostila}</Badge>
                      ) : (
                        <span className="text-gray-400">Não registrado</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge 
                        variant={aluno.dias_supera && aluno.dias_supera > 30 ? "default" : "secondary"} 
                        className={
                          aluno.dias_supera && aluno.dias_supera < 90 
                            ? "bg-orange-200 text-orange-800 border-orange-300" 
                            : aluno.dias_supera && aluno.dias_supera > 30 
                              ? "bg-green-100 text-green-800" 
                              : ""
                        }
                      >
                        {aluno.dias_supera || 0} dias
                      </Badge>
                    </td>
                    <td className="p-4">
                      {editandoWhatsApp === aluno.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={whatsappTemp}
                            onChange={(e) => setWhatsappTemp(e.target.value)}
                            placeholder="WhatsApp"
                            className="h-8 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSalvarWhatsApp(aluno.id);
                              } else if (e.key === 'Escape') {
                                handleCancelarEdicao();
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSalvarWhatsApp(aluno.id)}
                            disabled={salvandoWhatsApp === aluno.id}
                          >
                            {salvandoWhatsApp === aluno.id ? (
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="cursor-pointer hover:bg-gray-100 p-2 rounded min-h-[32px] flex items-center"
                          onClick={() => handleEditarWhatsApp(aluno)}
                        >
                          {aluno.whatapp_contato ? (
                            <span className="text-sm">{aluno.whatapp_contato}</span>
                          ) : (
                            <span className="text-gray-400 text-sm">Clique para adicionar</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVerDetalhes(aluno)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {alunosFiltrados.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum aluno encontrado com os filtros aplicados.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalhes do aluno */}
      {alunoSelecionado && (
        <DetalhesAlunoAtivoModal
          aluno={alunoSelecionado}
          onClose={handleFecharModal}
        />
      )}
    </div>
  );
}
