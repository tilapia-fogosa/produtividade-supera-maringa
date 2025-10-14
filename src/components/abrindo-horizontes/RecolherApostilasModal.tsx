import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTodosAlunos, TodosAlunosItem } from "@/hooks/use-todos-alunos";
import { Search, ChevronRight, ChevronLeft, BookOpen, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProfessores } from "@/hooks/use-professores";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTodasTurmas } from "@/hooks/use-todas-turmas";

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
  const [professorSelecionado, setProfessorSelecionado] = useState<string>('');
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>('');

  const { alunos, loading: loadingPessoas } = useTodosAlunos();
  const { toast } = useToast();
  const { professores, isLoading: loadingProfessores } = useProfessores();
  const { turmas, loading: loadingTurmas } = useTodasTurmas();

  // Filtrar pessoas pelo termo de busca e turma
  const pessoasFiltradas = alunos.filter(pessoa => {
    const matchNome = pessoa.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTurma = !turmaSelecionada || pessoa.turma_id === turmaSelecionada;
    return matchNome && matchTurma;
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
    if (!professorSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione o professor responsável pelo recolhimento",
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
          professor_id: professorSelecionado,
          responsavel_id: professorSelecionado,
        };
      });

      // Inserir todos os registros no banco
      const { error } = await supabase
        .from('ah_recolhidas')
        .insert(registrosParaInserir);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `${registrosParaInserir.length} apostila(s) recolhida(s) com sucesso`,
      });

      // Resetar estado e fechar modal
      setPessoasSelecionadas([]);
      setApostilasRecolhidas([]);
      setEtapa('selecao-pessoas');
      setSearchTerm('');
      setProfessorSelecionado('');
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
    setProfessorSelecionado('');
    setTurmaSelecionada('');
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

        {/* Seletor de Professor */}
        <div className="space-y-2 pb-4 border-b">
          <Label htmlFor="professor-responsavel">Professor responsável pelo recolhimento *</Label>
          <Select
            value={professorSelecionado}
            onValueChange={setProfessorSelecionado}
          >
            <SelectTrigger id="professor-responsavel">
              <SelectValue placeholder="Selecione um professor" />
            </SelectTrigger>
            <SelectContent>
              {loadingProfessores ? (
                <SelectItem value="loading" disabled>Carregando...</SelectItem>
              ) : professores.length === 0 ? (
                <SelectItem value="empty" disabled>Nenhum professor encontrado</SelectItem>
              ) : (
                professores.map((professor) => (
                  <SelectItem key={professor.id} value={professor.id}>
                    {professor.nome}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
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
                  <SelectItem value="">Todas as turmas</SelectItem>
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
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
            <ScrollArea className="flex-1 rounded-md border">
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
                disabled={pessoasSelecionadas.length === 0 || !professorSelecionado}
              >
                Avançar
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            {/* Lista de pessoas selecionadas com dropdown de apostilas */}
            <ScrollArea className="flex-1 rounded-md border">
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
                  disabled={!todasApostilasPreenchidas || isSubmitting || !professorSelecionado}
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
