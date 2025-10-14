import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTodosAlunos, TodosAlunosItem } from "@/hooks/use-todos-alunos";
import { ChevronRight, ChevronLeft, BookOpen, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProfessores } from "@/hooks/use-professores";
import { useEstagiarios } from "@/hooks/use-estagiarios";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTodasTurmas } from "@/hooks/use-todas-turmas";
import { usePessoasComRecolhimentoAberto } from "@/hooks/use-pessoas-com-recolhimento-aberto";
import { useQueryClient } from "@tanstack/react-query";
import { formatDateSaoPaulo, toUtcFromSaoPauloDate } from "@/lib/utils";

interface RecolherApostilasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Etapa = 'selecao-pessoas' | 'selecao-apostilas';

interface ApostilaRecolhida {
  pessoaId: string;
  apostilaNome: string;
}

// Lista de apostilas Abrindo Horizontes disponíveis
const APOSTILAS_AH = [
  'AH 1',
  'AH 2',
  'AH 3',
  'AH 4',
  'AH 4A',
  'AH 5',
  'AH 5A',
  'AH 6',
  'AH 7',
  'AH 8',
  'AH 9',
  'AH 10',
  'AH 11',
  'AH I Iniciar',
  'AH II Focar',
  'AH III Persistir',
  'AH IV Avançar',
  'AH Alta Performance'
];

export const RecolherApostilasModal = ({ open, onOpenChange }: RecolherApostilasModalProps) => {
  const [etapa, setEtapa] = useState<Etapa>('selecao-pessoas');
  const [pessoasSelecionadas, setPessoasSelecionadas] = useState<TodosAlunosItem[]>([]);
  const [apostilasRecolhidas, setApostilasRecolhidas] = useState<ApostilaRecolhida[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responsavelSelecionado, setResponsavelSelecionado] = useState<string>('');
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>('all');
  const [dataRecolhimento, setDataRecolhimento] = useState<string>(
    formatDateSaoPaulo(new Date(), 'yyyy-MM-dd')
  );

  const { alunos, loading: loadingPessoas } = useTodosAlunos();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { professores, isLoading: loadingProfessores } = useProfessores();
  const { estagiarios, isLoading: loadingEstagiarios } = useEstagiarios();
  const { turmas, loading: loadingTurmas } = useTodasTurmas();
  const { data: pessoasComRecolhimentoAberto = [] } = usePessoasComRecolhimentoAberto();

  // Combinar professores e estagiários em uma lista de responsáveis
  const responsaveis = useMemo(() => {
    const todosProfessores = professores.map(p => ({
      id: p.id,
      nome: `${p.nome} (Professor)`,
      tipo: 'professor' as const
    }));
    
    const todosEstagiarios = estagiarios.map(e => ({
      id: e.id,
      nome: `${e.nome} (Estagiário)`,
      tipo: 'estagiario' as const
    }));
    
    return [...todosProfessores, ...todosEstagiarios].sort((a, b) => 
      a.nome.localeCompare(b.nome)
    );
  }, [professores, estagiarios]);

  const loadingResponsaveis = loadingProfessores || loadingEstagiarios;

  // Filtrar pessoas pelo termo de busca, turma e excluir aquelas com recolhimento aberto
  const pessoasFiltradas = alunos.filter(pessoa => {
    const matchNome = pessoa.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTurma = turmaSelecionada === 'all' || pessoa.turma_id === turmaSelecionada;
    const temRecolhimentoAberto = pessoasComRecolhimentoAberto.includes(pessoa.id);
    return matchNome && matchTurma && !temRecolhimentoAberto;
  });

  const togglePessoa = (pessoa: TodosAlunosItem) => {
    setPessoasSelecionadas(prev => {
      const jaExiste = prev.find(p => p.id === pessoa.id);
      if (jaExiste) {
        return prev.filter(p => p.id !== pessoa.id);
      }
      return [...prev, pessoa];
    });
  };

  const handleAvancar = () => {
    if (pessoasSelecionadas.length > 0) {
      // Inicializar apostilas recolhidas com valores vazios
      const initialApostilas = pessoasSelecionadas.map(pessoa => ({
        pessoaId: pessoa.id,
        apostilaNome: ''
      }));
      setApostilasRecolhidas(initialApostilas);
      setEtapa('selecao-apostilas');
    }
  };

  const handleVoltar = () => {
    setEtapa('selecao-pessoas');
  };

  const handleApostilaChange = (pessoaId: string, apostilaNome: string) => {
    setApostilasRecolhidas(prev =>
      prev.map(item =>
        item.pessoaId === pessoaId ? { ...item, apostilaNome } : item
      )
    );
  };

  const handleConfirmar = async () => {
    if (!responsavelSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione o responsável pelo recolhimento",
        variant: "destructive",
      });
      return;
    }

    if (!dataRecolhimento) {
      toast({
        title: "Erro",
        description: "Selecione a data do recolhimento",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar os registros para inserção
      const registrosParaInserir = apostilasRecolhidas.map(item => {
        return {
          pessoa_id: item.pessoaId,
          apostila: item.apostilaNome,
          professor_id: responsavelSelecionado,
          responsavel_id: responsavelSelecionado,
          created_at: toUtcFromSaoPauloDate(dataRecolhimento),
        };
      });

      // Inserir todos os registros no banco
      const { error } = await supabase
        .from('ah_recolhidas')
        .insert(registrosParaInserir);

      if (error) throw error;

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ["apostilas-recolhidas"] });
      queryClient.invalidateQueries({ queryKey: ["pessoas-com-recolhimento-aberto"] });

      toast({
        title: "Sucesso!",
        description: `${registrosParaInserir.length} apostila(s) recolhida(s) com sucesso`,
      });

      // Resetar estado e fechar modal
      setPessoasSelecionadas([]);
      setApostilasRecolhidas([]);
      setEtapa('selecao-pessoas');
      setSearchTerm('');
      setResponsavelSelecionado('');
      setDataRecolhimento(formatDateSaoPaulo(new Date(), 'yyyy-MM-dd'));
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar apostilas recolhidas:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPessoasSelecionadas([]);
    setApostilasRecolhidas([]);
    setEtapa('selecao-pessoas');
    setSearchTerm('');
    setResponsavelSelecionado('');
    setTurmaSelecionada('all');
    setDataRecolhimento(formatDateSaoPaulo(new Date(), 'yyyy-MM-dd'));
    onOpenChange(false);
  };

  const todasApostilasPreenchidas = apostilasRecolhidas.every(item => item.apostilaNome !== '');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Recolher Apostilas
          </DialogTitle>
          <DialogDescription>
            {etapa === 'selecao-pessoas' 
              ? 'Selecione os alunos e funcionários para recolher as apostilas'
              : 'Selecione a apostila recolhida de cada pessoa'}
          </DialogDescription>
        </DialogHeader>

        {/* Campos obrigatórios */}
        <div className="space-y-4 pb-4 border-b">
          {/* Data de Recolhimento */}
          <div className="space-y-2">
            <Label htmlFor="data-recolhimento">Data do recolhimento *</Label>
            <Input
              id="data-recolhimento"
              type="date"
              value={dataRecolhimento}
              onChange={(e) => setDataRecolhimento(e.target.value)}
              max={formatDateSaoPaulo(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          {/* Seletor de Responsável */}
          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável pelo recolhimento *</Label>
            <Select
              value={responsavelSelecionado}
              onValueChange={setResponsavelSelecionado}
            >
              <SelectTrigger id="responsavel">
                <SelectValue placeholder="Selecione um responsável" />
              </SelectTrigger>
              <SelectContent>
                {loadingResponsaveis ? (
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                ) : responsaveis.length === 0 ? (
                  <SelectItem value="empty" disabled>Nenhum responsável encontrado</SelectItem>
                ) : (
                  responsaveis.map((responsavel) => (
                    <SelectItem key={responsavel.id} value={responsavel.id}>
                      {responsavel.nome}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {etapa === 'selecao-pessoas' ? (
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            {/* Filtro por turma */}
            <div className="space-y-2">
              <Label htmlFor="filtro-turma">Filtrar por turma</Label>
              <Select
                value={turmaSelecionada}
                onValueChange={setTurmaSelecionada}
              >
                <SelectTrigger id="filtro-turma">
                  <SelectValue placeholder="Todas as turmas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as turmas</SelectItem>
                  {loadingTurmas ? (
                    <SelectItem value="loading" disabled>Carregando...</SelectItem>
                  ) : turmas.length === 0 ? (
                    <SelectItem value="empty" disabled>Nenhuma turma encontrada</SelectItem>
                  ) : (
                    turmas.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Campo de busca */}
            <div>
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Badge com contador */}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {pessoasSelecionadas.length} pessoa(s) selecionada(s)
              </span>
            </div>

            {/* Lista de pessoas */}
            <ScrollArea className="rounded-md border h-[400px]">
              <div className="p-4 space-y-2">
                {loadingPessoas ? (
                  <p className="text-center text-muted-foreground py-8">Carregando...</p>
                ) : pessoasFiltradas.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma pessoa encontrada</p>
                ) : (
                  pessoasFiltradas.map((pessoa) => {
                    const selecionada = pessoasSelecionadas.some(p => p.id === pessoa.id);
                    return (
                      <div
                        key={pessoa.id}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => togglePessoa(pessoa)}
                      >
                        <Checkbox
                          checked={selecionada}
                          onCheckedChange={() => togglePessoa(pessoa)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{pessoa.nome}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{pessoa.turma_nome || 'Sem turma'}</span>
                            <Badge variant="outline" className="text-xs">
                              {pessoa.origem === 'aluno' ? 'Aluno' : 'Funcionário'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {/* Botão de avançar */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAvancar}
                disabled={pessoasSelecionadas.length === 0 || !responsavelSelecionado || !dataRecolhimento}
              >
                Avançar
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            {/* Lista de pessoas selecionadas com dropdown de apostilas */}
            <ScrollArea className="rounded-md border h-[400px]">
              <div className="p-4 space-y-4">
                {pessoasSelecionadas.map((pessoa) => {
                  const apostilaAtual = apostilasRecolhidas.find(a => a.pessoaId === pessoa.id);
                  
                  return (
                    <div key={pessoa.id} className="p-4 rounded-lg border bg-card">
                      <div className="mb-3">
                        <p className="font-medium">{pessoa.nome}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{pessoa.turma_nome || 'Sem turma'}</span>
                          <Badge variant="outline" className="text-xs">
                            {pessoa.origem === 'aluno' ? 'Aluno' : 'Funcionário'}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`apostila-${pessoa.id}`}>Apostila recolhida</Label>
                        <select
                          id={`apostila-${pessoa.id}`}
                          className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={apostilaAtual?.apostilaNome || ''}
                          onChange={(e) => handleApostilaChange(pessoa.id, e.target.value)}
                        >
                          <option value="">Selecione uma apostila AH</option>
                          {APOSTILAS_AH.map((apostila) => (
                            <option key={apostila} value={apostila}>
                              {apostila}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Botões de navegação */}
            <div className="flex justify-between gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleVoltar}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleConfirmar}
                  disabled={!todasApostilasPreenchidas || isSubmitting || !responsavelSelecionado || !dataRecolhimento}
                >
                  {isSubmitting ? "Salvando..." : "Confirmar Recolhimento"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
