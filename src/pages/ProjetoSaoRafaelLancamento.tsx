import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, BookOpen, Clock } from "lucide-react";
import { useAlunosProjetoSaoRafael } from '@/hooks/use-alunos-projeto-sao-rafael';
import AhLancamentoModal from '@/components/turmas/AhLancamentoModal';
import { PessoaAH } from '@/types/pessoa-ah';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ProjetoSaoRafaelLancamento = () => {
  const navigate = useNavigate();
  const { alunos, loading, filtro, setFiltro, totalFiltrados } = useAlunosProjetoSaoRafael();
  const [modalAberto, setModalAberto] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<PessoaAH | null>(null);

  const handleVoltar = () => {
    navigate('/projeto-sao-rafael');
  };

  const handleLancarAH = (aluno: any) => {
    console.log('ProjetoSaoRafaelLancamento: Selecionando aluno para AH:', aluno);
    const pessoaAH: PessoaAH = {
      id: aluno.id,
      nome: aluno.nome,
      turma_nome: aluno.turma_nome,
      origem: 'aluno',
      ultima_correcao_ah: aluno.ultima_correcao_ah
    };
    console.log('ProjetoSaoRafaelLancamento: PessoaAH convertida:', pessoaAH);
    setAlunoSelecionado(pessoaAH);
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
    setAlunoSelecionado(null);
  };

  const handleModalSuccess = (alunoId: string) => {
    console.log('ProjetoSaoRafaelLancamento: Lançamento AH bem-sucedido para aluno:', alunoId);
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
          <p className="text-azul-500 dark:text-foreground">Carregando alunos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Button 
        onClick={handleVoltar} 
        variant="outline" 
        className="mb-4 text-azul-500 border-orange-200 dark:border-primary dark:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>
      
      <h1 className="text-2xl font-bold mb-6 text-azul-500 dark:text-foreground">
        Projeto São Rafael - Lançar Abrindo Horizontes
      </h1>

      {/* Campo de busca */}
      <Card className="mb-6 border-orange-200 bg-white dark:bg-card dark:border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-azul-500 dark:text-foreground flex items-center">
            <Search className="mr-2 h-5 w-5" />
            Buscar Aluno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              placeholder="Digite o nome do aluno..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="dark:bg-background dark:border-border"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {totalFiltrados} aluno{totalFiltrados !== 1 ? 's' : ''} encontrado{totalFiltrados !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Lista de alunos */}
      <div className="grid grid-cols-1 gap-4">
        {alunos.map((aluno) => (
          <Card key={aluno.id} className="border-orange-200 bg-white dark:bg-card dark:border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-azul-500 dark:text-foreground">
                      {aluno.nome}
                    </h3>
                    <Badge 
                      variant="outline"
                      className="text-xs border-orange-300"
                    >
                      {aluno.turma_nome}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="font-medium">Última correção:</span>
                    <span className="ml-1">{formatarUltimaCorrecao(aluno.ultima_correcao_ah)}</span>
                  </div>
                </div>

                <Button
                  onClick={() => handleLancarAH(aluno)}
                  className="ml-4 bg-orange-500 hover:bg-orange-600 text-white"
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

export default ProjetoSaoRafaelLancamento;
