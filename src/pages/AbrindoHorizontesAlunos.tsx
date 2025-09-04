import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, BookOpen, Clock } from "lucide-react";
import { useTodosAlunos, TodosAlunosItem } from '@/hooks/use-todos-alunos';
import AhLancamentoModal from '@/components/turmas/AhLancamentoModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AbrindoHorizontesAlunos = () => {
  const navigate = useNavigate();
  const { alunos, loading, filtro, setFiltro, totalFiltrados } = useTodosAlunos();
  const [modalAberto, setModalAberto] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<TodosAlunosItem | null>(null);

  const handleVoltar = () => {
    navigate('/abrindo-horizontes/selecao');
  };

  const handleLancarAH = (aluno: TodosAlunosItem) => {
    setAlunoSelecionado(aluno);
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
    setAlunoSelecionado(null);
  };

  const handleModalSuccess = () => {
    // Atualizar a data da última correção no estado local se necessário
    // Por enquanto apenas fechar o modal
    handleFecharModal();
  };

  const formatarUltimaCorrecao = (data: string | null) => {
    if (!data) return 'Nunca';
    try {
      return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <p className="text-roxo-DEFAULT dark:text-foreground">Carregando alunos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Button 
        onClick={handleVoltar} 
        variant="outline" 
        className="mb-4 dark:border-primary dark:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>
      
      <h1 className="text-2xl font-bold mb-6 text-roxo-DEFAULT dark:text-foreground">
        Abrindo Horizontes - Por Aluno
      </h1>

      {/* Campo de busca */}
      <Card className="mb-6 border-orange-200 bg-white dark:bg-card dark:border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-roxo-DEFAULT dark:text-foreground flex items-center">
            <Search className="mr-2 h-5 w-5" />
            Buscar Aluno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              placeholder="Digite o nome do aluno ou da turma..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="pl-12 dark:bg-background dark:border-border"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {totalFiltrados} aluno{totalFiltrados !== 1 ? 's' : ''} encontrado{totalFiltrados !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Lista de alunos */}
      <div className="grid grid-cols-1 gap-4">
        {alunos.map((aluno) => (
          <Card key={`${aluno.origem}-${aluno.id}`} className="border-orange-200 bg-white dark:bg-card dark:border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-roxo-DEFAULT dark:text-foreground">
                      {aluno.nome}
                    </h3>
                    <Badge 
                      variant={aluno.origem === 'funcionario' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {aluno.origem === 'funcionario' ? 'Funcionário' : 'Aluno'}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <span className="font-medium">Turma:</span>
                      <span className="ml-1">{aluno.turma_nome || 'Sem turma'}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="font-medium">Última correção:</span>
                      <span className="ml-1">{formatarUltimaCorrecao(aluno.ultima_correcao_ah)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleLancarAH(aluno)}
                  className="ml-4 border-orange-300 text-roxo-DEFAULT hover:bg-orange-100 dark:border-primary dark:text-foreground dark:hover:bg-primary/20"
                  variant="outline"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Lançar AH
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {alunos.length === 0 && (
          <Card className="border-orange-200 bg-white dark:bg-card dark:border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {filtro ? 'Nenhum aluno encontrado com o filtro aplicado.' : 'Nenhum aluno encontrado.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de lançamento */}
      {alunoSelecionado && (
        <AhLancamentoModal
          isOpen={modalAberto}
          aluno={alunoSelecionado}
          onClose={handleFecharModal}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default AbrindoHorizontesAlunos;