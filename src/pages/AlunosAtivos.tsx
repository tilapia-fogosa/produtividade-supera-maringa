import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, MessageCircle, Save, Pencil, Check, X, Loader2, FileText, Award, Shirt, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { useAlunosAtivos, AlunoAtivo } from '@/hooks/use-alunos-ativos';
import { ExpandableAlunoCard } from '@/components/alunos/ExpandableAlunoCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SortField = 'nome' | 'turma' | 'professor' | 'apostila' | 'dias_supera' | 'data_nascimento';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export default function AlunosAtivos() {
  const navigate = useNavigate();
  const { 
    alunos, 
    loading, 
    error, 
    atualizarWhatsApp, 
    atualizarResponsavel,
    atualizarDataNascimento,
    atualizarFoto,
    atualizarEmail,
    atualizarTelefone,
    atualizarCoordenadorResponsavel,
    atualizarValorMensalidade,
    atualizarVencimentoContrato,
    atualizarMotivoProcura,
    atualizarPercepcaoCoordenador,
    atualizarPontosAtencao,
    atualizarDataOnboarding,
    atualizarValorMatricula,
    atualizarValorMaterial,
    atualizarKitSugerido,
    atualizarDataPrimeiraMensalidade,
  } = useAlunosAtivos();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTurma, setFilterTurma] = useState<string[]>([]);
  const [filterProfessor, setFilterProfessor] = useState<string[]>([]);
  const [filterApostila, setFilterApostila] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [alunoExpandido, setAlunoExpandido] = useState<AlunoAtivo | null>(null);
  const [editandoWhatsApp, setEditandoWhatsApp] = useState<string | null>(null);
  const [whatsappTemp, setWhatsappTemp] = useState('');
  const [salvandoWhatsApp, setSalvandoWhatsApp] = useState<string | null>(null);
  const [editandoResponsavel, setEditandoResponsavel] = useState<string | null>(null);
  const [responsavelTemp, setResponsavelTemp] = useState('');
  const [salvandoResponsavel, setSalvandoResponsavel] = useState<string | null>(null);
  
  const [editandoDataNascimento, setEditandoDataNascimento] = useState<string | null>(null);
  const [dataNascimentoTemp, setDataNascimentoTemp] = useState('');
  const [salvandoDataNascimento, setSalvandoDataNascimento] = useState<string | null>(null);

  // Estado para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Sincronizar alunoExpandido com a lista de alunos atualizada
  const alunoExpandidoSincronizado = useMemo(() => {
    if (!alunoExpandido) return null;
    return alunos.find(a => a.id === alunoExpandido.id) || null;
  }, [alunos, alunoExpandido]);

  // Extrair valores únicos para os filtros
  const turmasUnicas = useMemo(() => {
    return Array.from(new Set(alunos.map(aluno => aluno.turma_nome).filter(Boolean))).sort();
  }, [alunos]);
  const professoresUnicos = useMemo(() => {
    return Array.from(new Set(alunos.map(aluno => aluno.professor_nome).filter(Boolean))).sort();
  }, [alunos]);
  const apostilasUnicas = useMemo(() => {
    return Array.from(new Set(alunos.map(aluno => aluno.ultima_apostila).filter(Boolean))).sort();
  }, [alunos]);

  // Filtrar e ordenar alunos
  const alunosFiltrados = useMemo(() => {
    let resultado = alunos.filter(aluno => {
      const matchSearch = aluno.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTurma = filterTurma.length === 0 || filterTurma.includes(aluno.turma_nome || '');
      const matchProfessor = filterProfessor.length === 0 || filterProfessor.includes(aluno.professor_nome || '');
      const matchApostila = filterApostila.length === 0 || filterApostila.includes(aluno.ultima_apostila || '');
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
        case 'data_nascimento':
          valueA = a.data_nascimento || '';
          valueB = b.data_nascimento || '';
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

  // Paginação
  const totalPages = Math.ceil(alunosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const alunosPaginados = alunosFiltrados.slice(startIndex, endIndex);

  // Resetar para primeira página quando filtros mudarem
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTurma, filterProfessor, filterApostila, itemsPerPage]);

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
    setFilterTurma([]);
    setFilterProfessor([]);
    setFilterApostila([]);
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
  const handleEditarResponsavel = (aluno: AlunoAtivo) => {
    setEditandoResponsavel(aluno.id);
    setResponsavelTemp(aluno.responsavel || '');
  };
  const handleSalvarResponsavel = async (alunoId: string) => {
    setSalvandoResponsavel(alunoId);
    const sucesso = await atualizarResponsavel(alunoId, responsavelTemp);
    if (sucesso) {
      setEditandoResponsavel(null);
    }
    setSalvandoResponsavel(null);
  };
  const handleCancelarEdicaoResponsavel = () => {
    setEditandoResponsavel(null);
    setResponsavelTemp('');
  };

  const handleEditarDataNascimento = (aluno: AlunoAtivo) => {
    setEditandoDataNascimento(aluno.id);
    setDataNascimentoTemp(aluno.data_nascimento || '');
  };

  const handleSalvarDataNascimento = async (alunoId: string) => {
    setSalvandoDataNascimento(alunoId);
    const sucesso = await atualizarDataNascimento(alunoId, dataNascimentoTemp);
    setSalvandoDataNascimento(null);
    
    if (sucesso) {
      setEditandoDataNascimento(null);
    }
  };

  const handleCancelarEdicaoDataNascimento = () => {
    setEditandoDataNascimento(null);
    setDataNascimentoTemp('');
  };

  const formatarDataBr = (data: string | null): string => {
    if (!data) return '-';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const calcularIdade = (dataNascimento: string | null): number | null => {
    if (!dataNascimento) return null;
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const ehAniversarioHoje = (dataNascimento: string | null): boolean => {
    if (!dataNascimento) return false;
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    return hoje.getDate() === nascimento.getDate() && hoje.getMonth() === nascimento.getMonth();
  };
  const handleAbrirWhatsApp = (aluno: AlunoAtivo) => {
    const numero = aluno.whatapp_contato;
    if (!numero) {
      alert('Este aluno não possui WhatsApp cadastrado');
      return;
    }

    // Remove caracteres especiais e espaços do número
    const numeroLimpo = numero.replace(/\D/g, '');

    // Abre o WhatsApp Web/App
    const url = `https://wa.me/55${numeroLimpo}`;
    window.open(url, '_blank');
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
  return <div className="p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Alunos Ativos</h1>
          <Badge variant="secondary" className="text-sm bg-purple-400 mt-2">
            {alunosFiltrados.length} de {alunos.length} pessoas
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/trofeus-1000-dias')}
            className="flex items-center gap-2"
          >
            <Award className="w-4 h-4" />
            Troféus
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/camisetas')}
            className="flex items-center gap-2"
          >
            <Shirt className="w-4 h-4" />
            Camisetas
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/devolutivas')}
            className="flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Devolutivas
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/fichas')}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Fichas
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/diario')}
            className="flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Diários
          </Button>
        </div>
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
            <Input placeholder="Buscar por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>

          {/* Filtros por seleção */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  {filterTurma.length === 0 ? "Filtrar por turma" : `${filterTurma.length} turma(s) selecionada(s)`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4">
                <div className="space-y-2">
                  {turmasUnicas.map(turma => (
                    <div key={turma} className="flex items-center space-x-2">
                      <Checkbox
                        id={`turma-${turma}`}
                        checked={filterTurma.includes(turma)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilterTurma([...filterTurma, turma]);
                          } else {
                            setFilterTurma(filterTurma.filter(t => t !== turma));
                          }
                        }}
                      />
                      <label htmlFor={`turma-${turma}`} className="text-sm cursor-pointer">
                        {turma}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  {filterProfessor.length === 0 ? "Filtrar por professor" : `${filterProfessor.length} professor(es) selecionado(s)`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4">
                <div className="space-y-2">
                  {professoresUnicos.map(professor => (
                    <div key={professor} className="flex items-center space-x-2">
                      <Checkbox
                        id={`professor-${professor}`}
                        checked={filterProfessor.includes(professor)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilterProfessor([...filterProfessor, professor]);
                          } else {
                            setFilterProfessor(filterProfessor.filter(p => p !== professor));
                          }
                        }}
                      />
                      <label htmlFor={`professor-${professor}`} className="text-sm cursor-pointer">
                        {professor}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  {filterApostila.length === 0 ? "Filtrar por apostila" : `${filterApostila.length} apostila(s) selecionada(s)`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4">
                <div className="space-y-2">
                  {apostilasUnicas.map(apostila => (
                    <div key={apostila} className="flex items-center space-x-2">
                      <Checkbox
                        id={`apostila-${apostila}`}
                        checked={filterApostila.includes(apostila)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilterApostila([...filterApostila, apostila]);
                          } else {
                            setFilterApostila(filterApostila.filter(a => a !== apostila));
                          }
                        }}
                      />
                      <label htmlFor={`apostila-${apostila}`} className="text-sm cursor-pointer">
                        {apostila}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Button variant="outline" onClick={clearFilters} className="w-full md:w-auto">
            Limpar Filtros
          </Button>
        </CardContent>
      </Card>

      {/* Lista de alunos */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-w-full">
            <div className="min-w-[1200px]">
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
                  <th className="text-left p-4">
                    <Button variant="ghost" onClick={() => handleSort('data_nascimento')} className="font-semibold hover:bg-gray-100">
                      Data de Nascimento
                      {getSortIcon('data_nascimento')}
                    </Button>
                  </th>
                   <th className="text-left p-4 w-[180px]">
                     <span className="font-semibold flex items-center gap-2">
                       <MessageCircle className="w-4 h-4" />
                       WhatsApp para contato
                     </span>
                   </th>
                   <th className="text-left p-4 w-[150px]">
                     <span className="font-semibold">Responsável</span>
                   </th>
                   <th className="text-left p-4 w-[60px]">
                     <span className="font-semibold">Ações</span>
                   </th>
                </tr>
              </thead>
              <tbody>
                {alunosPaginados.map(aluno => <tr 
                  key={aluno.id} 
                  className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={(e) => {
                    // Não expandir se clicar em campo editável
                    const target = e.target as HTMLElement;
                    if (target.closest('.editable-field') || target.closest('button')) return;
                    setAlunoExpandido(aluno);
                  }}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{aluno.nome}</span>
                      {aluno.tipo_pessoa === 'funcionario' && <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                          Funcionário
                        </Badge>}
                      {aluno.cargo && <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                          {aluno.cargo}
                        </Badge>}
                    </div>
                  </td>
                    <td className="p-4">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {aluno.turma_nome || 'Sem turma'}
                      </Badge>
                    </td>
                    <td className="p-4">{aluno.professor_nome || 'Não atribuído'}</td>
                    <td className="p-4">
                      {aluno.ultima_apostila ? <Badge variant="secondary" className="bg-violet-400">{aluno.ultima_apostila}</Badge> : <span className="text-gray-400">Não registrado</span>}
                    </td>
                    <td className="p-4">
                      <Badge variant={aluno.dias_supera && aluno.dias_supera > 30 ? "default" : "secondary"} className={aluno.dias_supera && aluno.dias_supera < 90 ? "bg-orange-200 text-orange-800 border-orange-300" : aluno.dias_supera && aluno.dias_supera > 30 ? "bg-green-100 text-green-800" : ""}>
                        {aluno.dias_supera || 0} dias
                      </Badge>
                    </td>
                    <td className="p-4">
                      {editandoDataNascimento === aluno.id ? (
                        <div className="flex items-center gap-2 editable-field">
                          <Input
                            type="date"
                            value={dataNascimentoTemp}
                            onChange={(e) => setDataNascimentoTemp(e.target.value)}
                            className="h-8 text-sm w-40"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSalvarDataNascimento(aluno.id);
                              } else if (e.key === 'Escape') {
                                handleCancelarEdicaoDataNascimento();
                              }
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSalvarDataNascimento(aluno.id)}
                            disabled={salvandoDataNascimento === aluno.id}
                          >
                            {salvandoDataNascimento === aluno.id ? (
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="editable-field hover:bg-gray-100 p-2 rounded min-h-[32px] flex items-center gap-2" onClick={() => handleEditarDataNascimento(aluno)}>
                          <span className="text-sm">
                            {aluno.data_nascimento ? (
                              <>
                                {formatarDataBr(aluno.data_nascimento)}
                                {calcularIdade(aluno.data_nascimento) && ` (${calcularIdade(aluno.data_nascimento)} anos)`}
                              </>
                            ) : (
                              <span className="text-gray-400">Clique para adicionar</span>
                            )}
                          </span>
                          {ehAniversarioHoje(aluno.data_nascimento) && (
                            <span className="text-xl" title="Aniversário hoje! 🎉">🎂</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {editandoWhatsApp === aluno.id ? <div className="flex items-center gap-2 editable-field">
                          <Input value={whatsappTemp} onChange={e => setWhatsappTemp(e.target.value)} placeholder="WhatsApp" className="h-8 text-sm" onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleSalvarWhatsApp(aluno.id);
                      } else if (e.key === 'Escape') {
                        handleCancelarEdicao();
                      }
                    }} autoFocus />
                          <Button variant="ghost" size="sm" onClick={() => handleSalvarWhatsApp(aluno.id)} disabled={salvandoWhatsApp === aluno.id}>
                            {salvandoWhatsApp === aluno.id ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Save className="w-4 h-4" />}
                          </Button>
                        </div> : <div className="editable-field hover:bg-gray-100 p-2 rounded min-h-[32px] flex items-center" onClick={() => handleEditarWhatsApp(aluno)}>
                          {aluno.whatapp_contato ? <span className="text-sm">{aluno.whatapp_contato}</span> : <span className="text-gray-400 text-sm">Clique para adicionar</span>}
                        </div>}
                     </td>
                     <td className="p-4">
                       {editandoResponsavel === aluno.id ? <div className="flex items-center gap-2 editable-field">
                           <Input value={responsavelTemp} onChange={e => setResponsavelTemp(e.target.value)} placeholder="Responsável" className="h-8 text-sm" onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleSalvarResponsavel(aluno.id);
                      } else if (e.key === 'Escape') {
                        handleCancelarEdicaoResponsavel();
                      }
                    }} autoFocus />
                           <Button variant="ghost" size="sm" onClick={() => handleSalvarResponsavel(aluno.id)} disabled={salvandoResponsavel === aluno.id}>
                             {salvandoResponsavel === aluno.id ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Save className="w-4 h-4" />}
                           </Button>
                         </div> : <div className="editable-field hover:bg-gray-100 p-2 rounded min-h-[32px] flex items-center" onClick={() => handleEditarResponsavel(aluno)}>
                           {aluno.responsavel ? <span className="text-sm">{aluno.responsavel}</span> : <span className="text-gray-400 text-sm">Clique para adicionar</span>}
                         </div>}
                     </td>
                       <td className="p-4">
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           onClick={(e) => {
                             e.stopPropagation();
                             handleAbrirWhatsApp(aluno);
                           }} 
                           className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" 
                           title="Abrir WhatsApp"
                         >
                           <MessageCircle className="w-4 h-4" />
                         </Button>
                       </td>
                  </tr>)}
              </tbody>
            </table>

            {alunosPaginados.length === 0 && <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma pessoa encontrada com os filtros aplicados.</p>
              </div>}
            </div>
          </div>

          {/* Paginação no rodapé do Card */}
          {alunosFiltrados.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-muted/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Exibindo {startIndex + 1} - {Math.min(endIndex, alunosFiltrados.length)} de {alunosFiltrados.length}</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => setItemsPerPage(Number(value))}
                >
                  <SelectTrigger className="w-[100px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option.toString()}>
                        {option} itens
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="hidden sm:flex"
                >
                  Primeira
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm px-2">
                  Página {currentPage} de {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage >= totalPages}
                  className="hidden sm:flex"
                >
                  Última
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card expandido do aluno */}
      <ExpandableAlunoCard 
        aluno={alunoExpandidoSincronizado} 
        onClose={() => setAlunoExpandido(null)}
        updateFunctions={{
          atualizarFoto,
          atualizarEmail,
          atualizarTelefone,
          atualizarCoordenadorResponsavel,
          atualizarValorMensalidade,
          atualizarVencimentoContrato,
          atualizarMotivoProcura,
          atualizarPercepcaoCoordenador,
          atualizarPontosAtencao,
          atualizarDataOnboarding,
          atualizarValorMatricula,
          atualizarValorMaterial,
          atualizarKitSugerido,
          atualizarDataPrimeiraMensalidade,
        }}
      />
    </div>;
}