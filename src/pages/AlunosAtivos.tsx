import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, MessageCircle, Save, Check, Loader2, FileText, Award, Shirt, BookOpen } from "lucide-react";
import { useAlunosAtivos, AlunoAtivo } from '@/hooks/use-alunos-ativos';
import { ExpandableAlunoCard } from '@/components/alunos/ExpandableAlunoCard';

type SortField = 'nome' | 'turma' | 'professor' | 'apostila' | 'dias_supera' | 'data_nascimento';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_LOAD = 15;

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

  // Estado para infinite scroll
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

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

  // Infinite scroll - alunos visíveis
  const alunosVisiveis = useMemo(() => {
    return alunosFiltrados.slice(0, visibleCount);
  }, [alunosFiltrados, visibleCount]);

  const hasMore = visibleCount < alunosFiltrados.length;

  // Resetar contagem quando filtros mudarem
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [searchTerm, filterTurma, filterProfessor, filterApostila, sortField, sortDirection]);

  // Carregar mais ao scrollar
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + ITEMS_PER_LOAD, alunosFiltrados.length));
      setIsLoadingMore(false);
    }, 100);
  }, [isLoadingMore, hasMore, alunosFiltrados.length]);

  // IntersectionObserver para detectar scroll
  useEffect(() => {
    const currentLoader = loaderRef.current;
    if (!currentLoader || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(currentLoader);

    return () => {
      observer.disconnect();
    };
  }, [loadMore, hasMore, alunosVisiveis.length]);

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
  return <div className="p-2 space-y-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold">Alunos Ativos</h1>
          <Badge variant="secondary" className="text-[10px] bg-purple-400 px-1.5 py-0">
            {alunosFiltrados.length} de {alunos.length}
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/trofeus-1000-dias')}
            className="flex items-center gap-1 h-6 text-xs px-2"
          >
            <Award className="w-3 h-3" />
            Troféus
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/camisetas')}
            className="flex items-center gap-1 h-6 text-xs px-2"
          >
            <Shirt className="w-3 h-3" />
            Camisetas
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/devolutivas')}
            className="flex items-center gap-1 h-6 text-xs px-2"
          >
            <MessageCircle className="w-3 h-3" />
            Devolutivas
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/fichas')}
            className="flex items-center gap-1 h-6 text-xs px-2"
          >
            <FileText className="w-3 h-3" />
            Fichas
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/diario')}
            className="flex items-center gap-1 h-6 text-xs px-2"
          >
            <BookOpen className="w-3 h-3" />
            Diários
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="py-0">
        <CardContent className="p-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Busca por nome */}
            <Input 
              placeholder="Buscar por nome..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-48 h-7 text-xs"
            />

            {/* Filtros por seleção */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                  {filterTurma.length === 0 ? "Turma" : `${filterTurma.length} turma(s)`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2">
                <div className="space-y-1 max-h-48 overflow-y-auto">
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
                        className="h-3.5 w-3.5"
                      />
                      <label htmlFor={`turma-${turma}`} className="text-xs cursor-pointer">
                        {turma}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                  {filterProfessor.length === 0 ? "Professor" : `${filterProfessor.length} prof.`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2">
                <div className="space-y-1 max-h-48 overflow-y-auto">
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
                        className="h-3.5 w-3.5"
                      />
                      <label htmlFor={`professor-${professor}`} className="text-xs cursor-pointer">
                        {professor}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                  {filterApostila.length === 0 ? "Apostila" : `${filterApostila.length} apost.`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2">
                <div className="space-y-1 max-h-48 overflow-y-auto">
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
                        className="h-3.5 w-3.5"
                      />
                      <label htmlFor={`apostila-${apostila}`} className="text-xs cursor-pointer">
                        {apostila}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {(filterTurma.length > 0 || filterProfessor.length > 0 || filterApostila.length > 0 || searchTerm) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs px-2 text-muted-foreground">
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de alunos */}
      <Card className="flex flex-col">
        <CardContent className="p-0 flex flex-col">
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              {/* Cabeçalho fixo */}
              <div className="bg-muted/50 border-b sticky top-0 z-10">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left px-2 py-1 w-[180px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('nome')} className="font-semibold text-xs h-7">
                          Nome
                          {getSortIcon('nome')}
                        </Button>
                      </th>
                      <th className="text-left px-2 py-1 w-[100px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('turma')} className="font-semibold text-xs h-7">
                          Turma
                          {getSortIcon('turma')}
                        </Button>
                      </th>
                      <th className="text-left px-2 py-1 w-[120px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('professor')} className="font-semibold text-xs h-7">
                          Professor
                          {getSortIcon('professor')}
                        </Button>
                      </th>
                      <th className="text-left px-2 py-1 w-[100px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('apostila')} className="font-semibold text-xs h-7">
                          Apostila
                          {getSortIcon('apostila')}
                        </Button>
                      </th>
                      <th className="text-left px-2 py-1 w-[100px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('dias_supera')} className="font-semibold text-xs h-7">
                          Dias Supera
                          {getSortIcon('dias_supera')}
                        </Button>
                      </th>
                      <th className="text-left px-2 py-1 w-[140px]">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('data_nascimento')} className="font-semibold text-xs h-7">
                          Nascimento
                          {getSortIcon('data_nascimento')}
                        </Button>
                      </th>
                      <th className="text-left px-2 py-1 w-[160px]">
                        <span className="font-semibold text-xs flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          WhatsApp
                        </span>
                      </th>
                      <th className="text-left px-2 py-1 w-[120px]">
                        <span className="font-semibold text-xs">Responsável</span>
                      </th>
                      <th className="text-left px-2 py-1 w-[50px]">
                        <span className="font-semibold text-xs">Ações</span>
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Corpo com scroll interno - altura fixa para ~15 linhas */}
              <div 
                className="overflow-y-auto"
                style={{ maxHeight: '420px' }}
              >
                <table className="w-full">
                  <tbody>
                    {alunosVisiveis.map(aluno => <tr 
                      key={aluno.id} 
                      className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={(e) => {
                        // Não expandir se clicar em campo editável
                        const target = e.target as HTMLElement;
                        if (target.closest('.editable-field') || target.closest('button')) return;
                        setAlunoExpandido(aluno);
                      }}
                    >
                      <td className="px-2 py-1 w-[180px]">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium">{aluno.nome}</span>
                          {aluno.tipo_pessoa === 'funcionario' && <Badge variant="outline" className="bg-blue-50 text-blue-700 text-[10px] px-1 py-0">
                              Func.
                            </Badge>}
                          {aluno.cargo && <Badge variant="outline" className="bg-green-50 text-green-700 text-[10px] px-1 py-0">
                              {aluno.cargo}
                            </Badge>}
                        </div>
                      </td>
                      <td className="px-2 py-1 w-[100px]">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 text-[10px] px-1 py-0">
                          {aluno.turma_nome || 'Sem turma'}
                        </Badge>
                      </td>
                      <td className="px-2 py-1 text-xs w-[120px]">{aluno.professor_nome || 'Não atribuído'}</td>
                      <td className="px-2 py-1 w-[100px]">
                        {aluno.ultima_apostila ? <Badge variant="secondary" className="bg-violet-400 text-[10px] px-1 py-0">{aluno.ultima_apostila}</Badge> : <span className="text-muted-foreground text-xs">-</span>}
                      </td>
                      <td className="px-2 py-1 w-[100px]">
                        <Badge variant={aluno.dias_supera && aluno.dias_supera > 30 ? "default" : "secondary"} className={`text-[10px] px-1 py-0 ${aluno.dias_supera && aluno.dias_supera < 90 ? "bg-orange-200 text-orange-800 border-orange-300" : aluno.dias_supera && aluno.dias_supera > 30 ? "bg-green-100 text-green-800" : ""}`}>
                          {aluno.dias_supera || 0} dias
                        </Badge>
                      </td>
                      <td className="px-2 py-1 w-[140px]">
                        {editandoDataNascimento === aluno.id ? (
                          <div className="flex items-center gap-1 editable-field">
                            <Input
                              type="date"
                              value={dataNascimentoTemp}
                              onChange={(e) => setDataNascimentoTemp(e.target.value)}
                              className="h-6 text-xs w-32"
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
                              className="h-6 w-6 p-0"
                              onClick={() => handleSalvarDataNascimento(aluno.id)}
                              disabled={salvandoDataNascimento === aluno.id}
                            >
                              {salvandoDataNascimento === aluno.id ? (
                                <div className="w-3 h-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div className="editable-field hover:bg-muted px-1 py-0.5 rounded flex items-center gap-1 cursor-pointer" onClick={() => handleEditarDataNascimento(aluno)}>
                            <span className="text-xs">
                              {aluno.data_nascimento ? (
                                <>
                                  {formatarDataBr(aluno.data_nascimento)}
                                  {calcularIdade(aluno.data_nascimento) && ` (${calcularIdade(aluno.data_nascimento)})`}
                                </>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </span>
                            {ehAniversarioHoje(aluno.data_nascimento) && (
                              <span className="text-sm" title="Aniversário hoje! 🎉">🎂</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-1 w-[160px]">
                        {editandoWhatsApp === aluno.id ? <div className="flex items-center gap-1 editable-field">
                            <Input value={whatsappTemp} onChange={e => setWhatsappTemp(e.target.value)} placeholder="WhatsApp" className="h-6 text-xs w-28" onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleSalvarWhatsApp(aluno.id);
                        } else if (e.key === 'Escape') {
                          handleCancelarEdicao();
                        }
                      }} autoFocus />
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleSalvarWhatsApp(aluno.id)} disabled={salvandoWhatsApp === aluno.id}>
                              {salvandoWhatsApp === aluno.id ? <div className="w-3 h-3 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Save className="w-3 h-3" />}
                            </Button>
                          </div> : <div className="editable-field hover:bg-muted px-1 py-0.5 rounded flex items-center cursor-pointer" onClick={() => handleEditarWhatsApp(aluno)}>
                            {aluno.whatapp_contato ? <span className="text-xs">{aluno.whatapp_contato}</span> : <span className="text-muted-foreground text-xs">-</span>}
                          </div>}
                      </td>
                      <td className="px-2 py-1 w-[120px]">
                        {editandoResponsavel === aluno.id ? <div className="flex items-center gap-1 editable-field">
                            <Input value={responsavelTemp} onChange={e => setResponsavelTemp(e.target.value)} placeholder="Responsável" className="h-6 text-xs w-24" onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleSalvarResponsavel(aluno.id);
                        } else if (e.key === 'Escape') {
                          handleCancelarEdicaoResponsavel();
                        }
                      }} autoFocus />
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleSalvarResponsavel(aluno.id)} disabled={salvandoResponsavel === aluno.id}>
                              {salvandoResponsavel === aluno.id ? <div className="w-3 h-3 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Save className="w-3 h-3" />}
                            </Button>
                          </div> : <div className="editable-field hover:bg-muted px-1 py-0.5 rounded flex items-center cursor-pointer" onClick={() => handleEditarResponsavel(aluno)}>
                            {aluno.responsavel ? <span className="text-xs">{aluno.responsavel}</span> : <span className="text-muted-foreground text-xs">-</span>}
                          </div>}
                      </td>
                      <td className="px-2 py-1 w-[50px]">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAbrirWhatsApp(aluno);
                          }} 
                          className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50" 
                          title="Abrir WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>)}
                  </tbody>
                </table>

                {alunosVisiveis.length === 0 && <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhuma pessoa encontrada com os filtros aplicados.</p>
                  </div>}
                
                {/* Loader para infinite scroll */}
                {hasMore && (
                  <div 
                    ref={loaderRef} 
                    className="flex items-center justify-center py-3 text-muted-foreground"
                  >
                    {isLoadingMore ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs">Carregando mais...</span>
                      </div>
                    ) : (
                      <span className="text-xs">Role para carregar mais</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rodapé fixo com contador */}
          {alunosFiltrados.length > 0 && (
            <div className="flex items-center justify-center gap-2 p-2 border-t bg-muted/30 text-xs text-muted-foreground">
              <span>Exibindo {alunosVisiveis.length} de {alunosFiltrados.length}</span>
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