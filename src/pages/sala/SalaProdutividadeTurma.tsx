
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Turma } from '@/hooks/use-professor-turmas';
import { useSalaPessoasTurma, SalaPessoaTurma } from '@/hooks/sala/use-sala-pessoas-turma';
import { useLembretesAlunos } from '@/hooks/sala/use-lembretes-alunos';
import { useReposicoesHoje } from '@/hooks/sala/use-reposicoes-hoje';
import SalaProdutividadeScreen from '@/components/sala/SalaProdutividadeScreen';
import SalaProdutividadeDrawer from '@/components/sala/SalaProdutividadeDrawer';
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
import { format } from 'date-fns';

const SalaProdutividadeTurma = () => {
  const { turmaId } = useParams();
  const navigate = useNavigate();
  
  const [turma, setTurma] = useState<Turma | null>(null);
  const [loadingTurma, setLoadingTurma] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [pessoaSelecionada, setPessoaSelecionada] = useState<SalaPessoaTurma | null>(null);
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState(false);
  const [pessoaParaExcluir, setPessoaParaExcluir] = useState<SalaPessoaTurma | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [presencaInicial, setPresencaInicial] = useState(true);
  const [modoReposicao, setModoReposicao] = useState(false);

  const {
    pessoasTurma,
    loading: loadingPessoas,
    buscarPessoasPorTurma,
    atualizarProdutividadeRegistrada,
    recarregarDadosAposExclusao
  } = useSalaPessoasTurma();

  // Buscar reposições do dia para esta turma
  const { reposicoes: reposicoesHoje } = useReposicoesHoje(turmaId);

  // IDs dos alunos para buscar lembretes (incluindo reposições)
  const alunoIds = useMemo(() => {
    const idsFixos = pessoasTurma.filter(p => p.origem === 'aluno').map(p => p.id);
    const idsReposicao = reposicoesHoje.filter(r => r.pessoa_tipo === 'aluno').map(r => r.pessoa_id);
    return [...new Set([...idsFixos, ...idsReposicao])];
  }, [pessoasTurma, reposicoesHoje]);

  const { lembretes } = useLembretesAlunos(alunoIds);

  // Buscar dados da turma
  useEffect(() => {
    const fetchTurma = async () => {
      if (!turmaId) return;
      
      try {
        const { data, error } = await supabase
          .from('turmas')
          .select('*')
          .eq('id', turmaId)
          .single();

        if (error) {
          console.error('[Sala] Erro ao buscar turma:', error);
          return;
        }

        setTurma(data);
      } catch (error) {
        console.error('[Sala] Erro ao buscar turma:', error);
      } finally {
        setLoadingTurma(false);
      }
    };

    fetchTurma();
  }, [turmaId]);

  // Buscar pessoas da turma
  useEffect(() => {
    if (turmaId) {
      buscarPessoasPorTurma(turmaId);
    }
  }, [turmaId, buscarPessoasPorTurma]);

  const diasParaState: Record<string, string> = {
    'Segunda-feira': 'segunda',
    'Terça-feira': 'terca',
    'Quarta-feira': 'quarta',
    'Quinta-feira': 'quinta',
    'Sexta-feira': 'sexta',
    'Sábado': 'sabado',
  };

  const handleVoltar = () => {
    if (turma?.dia_semana) {
      const dia = diasParaState[turma.dia_semana] || 'segunda';
      navigate('/sala/turmas/dia', { state: { dia } });
    } else {
      navigate('/sala/dias-lancamento');
    }
  };

  const handleRegistrarPresenca = (pessoa: SalaPessoaTurma, presente: boolean) => {
    setPessoaSelecionada(pessoa);
    setPresencaInicial(presente);
    setModoReposicao(false);
    setModalAberto(true);
  };

  const handleReposicao = () => {
    setPessoaSelecionada(null);
    setPresencaInicial(true);
    setModoReposicao(true);
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
    setPessoaSelecionada(null);
    setModoReposicao(false);
  };

  const handleSucesso = () => {
    if (pessoaSelecionada) {
      atualizarProdutividadeRegistrada(pessoaSelecionada.id, true);
    }
  };

  const handleErro = (error: string) => {
    console.error('[Sala] Erro:', error);
  };

  const handleExcluirRegistro = (pessoa: SalaPessoaTurma) => {
    setPessoaParaExcluir(pessoa);
    setConfirmacaoExclusao(true);
  };

  const handleConfirmarExclusao = async () => {
    if (!pessoaParaExcluir) return;

    setExcluindo(true);
    try {
      const hoje = format(new Date(), 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('produtividade_abaco')
        .delete()
        .eq('pessoa_id', pessoaParaExcluir.id)
        .eq('data_aula', hoje);

      if (error) {
        throw error;
      }

      recarregarDadosAposExclusao(pessoaParaExcluir.id);
    } catch (error) {
      console.error('[Sala] Erro ao excluir registro:', error);
    } finally {
      setExcluindo(false);
      setConfirmacaoExclusao(false);
      setPessoaParaExcluir(null);
    }
  };

  if (loadingTurma) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Carregando turma...</p>
        </div>
      </div>
    );
  }

  if (!turma) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Turma não encontrada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <SalaProdutividadeScreen
        turma={turma}
        onBack={handleVoltar}
        alunos={pessoasTurma}
        onRegistrarPresenca={handleRegistrarPresenca}
        onExcluirRegistro={handleExcluirRegistro}
        onReposicao={handleReposicao}
        lembretes={lembretes}
        reposicoesHoje={reposicoesHoje}
      />

      <SalaProdutividadeDrawer
        isOpen={modalAberto}
        onClose={handleFecharModal}
        pessoa={pessoaSelecionada}
        turma={turma}
        onSuccess={handleSucesso}
        onError={handleErro}
        presencaInicial={presencaInicial}
        modoReposicao={modoReposicao}
      />

      <AlertDialog open={confirmacaoExclusao} onOpenChange={setConfirmacaoExclusao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o registro de produtividade de{' '}
              <strong>{pessoaParaExcluir?.nome}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmarExclusao}
              disabled={excluindo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {excluindo ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SalaProdutividadeTurma;
