
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Turma } from '@/hooks/use-professor-turmas';
import { useSalaPessoasTurma, SalaPessoaTurma } from '@/hooks/sala/use-sala-pessoas-turma';
import { useLembretesAlunos } from '@/hooks/sala/use-lembretes-alunos';
import { useReposicoesHoje } from '@/hooks/sala/use-reposicoes-hoje';
import { useAulasExperimentaisHoje } from '@/hooks/sala/use-aulas-experimentais-hoje';
import { calcularUltimaAula } from '@/utils/calcularUltimaAula';
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
  
  // Estado da data selecionada - inicializada como undefined até a turma carregar
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>(undefined);

  const {
    pessoasTurma,
    loading: loadingPessoas,
    buscarPessoasPorTurma,
    atualizarProdutividadeRegistrada,
    recarregarDadosAposExclusao
  } = useSalaPessoasTurma();

  // Buscar reposições do dia para esta turma
  const { reposicoes: reposicoesHoje, refetch: refetchReposicoes } = useReposicoesHoje(turmaId, dataSelecionada);

  // Buscar aulas experimentais do dia para esta turma
  const { aulasExperimentais, refetch: refetchAulasExperimentais } = useAulasExperimentaisHoje(turmaId, dataSelecionada);

  // IDs dos alunos para buscar lembretes (incluindo reposições)
  const alunoIds = useMemo(() => {
    const idsFixos = pessoasTurma.filter(p => p.origem === 'aluno').map(p => p.id);
    const idsReposicao = reposicoesHoje.filter(r => r.pessoa_tipo === 'aluno').map(r => r.pessoa_id);
    return [...new Set([...idsFixos, ...idsReposicao])];
  }, [pessoasTurma, reposicoesHoje]);

  const { lembretes, refetch: refetchLembretes } = useLembretesAlunos(alunoIds);

  // Callback quando um lembrete é concluído (camiseta ou apostila AH)
  const handleLembreteConcluido = () => {
    refetchLembretes();
  };

  // Callback para mudança de data
  const handleDataChange = useCallback((novaData: Date) => {
    setDataSelecionada(novaData);
  }, []);

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
        
        // Calcular a última aula baseado no dia da semana da turma
        const ultimaAula = calcularUltimaAula(data.dia_semana);
        setDataSelecionada(ultimaAula);
      } catch (error) {
        console.error('[Sala] Erro ao buscar turma:', error);
      } finally {
        setLoadingTurma(false);
      }
    };

    fetchTurma();
  }, [turmaId]);

  // Buscar pessoas da turma quando a data mudar
  useEffect(() => {
    if (turmaId && dataSelecionada) {
      buscarPessoasPorTurma(turmaId, dataSelecionada);
    }
  }, [turmaId, dataSelecionada, buscarPessoasPorTurma]);

  // Refresh automático a cada 60 segundos
  const REFRESH_INTERVAL = 60 * 1000;
  
  useEffect(() => {
    if (!turmaId || !dataSelecionada) return;

    const intervalId = setInterval(() => {
      console.log('[Sala] Refresh automático - recarregando dados...');
      buscarPessoasPorTurma(turmaId, dataSelecionada);
      refetchReposicoes();
      refetchAulasExperimentais();
    }, REFRESH_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [turmaId, dataSelecionada, buscarPessoasPorTurma, refetchReposicoes]);

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
    // Recarregar dados após sucesso
    if (turmaId && dataSelecionada) {
      buscarPessoasPorTurma(turmaId, dataSelecionada);
      refetchReposicoes();
      refetchAulasExperimentais();
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
    if (!pessoaParaExcluir || !dataSelecionada) return;

    setExcluindo(true);
    try {
      const dataExclusao = format(dataSelecionada, 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('produtividade_abaco')
        .delete()
        .eq('pessoa_id', pessoaParaExcluir.id)
        .eq('data_aula', dataExclusao);

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
        onLembreteConcluido={handleLembreteConcluido}
        dataSelecionada={dataSelecionada}
        onDataChange={handleDataChange}
        aulasExperimentais={aulasExperimentais}
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
        dataInicial={dataSelecionada}
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
