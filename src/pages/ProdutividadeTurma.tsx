
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import ProdutividadeScreen from '@/components/turmas/turma-detail/ProdutividadeScreen';
import { useAlunos } from '@/hooks/use-alunos';
import { usePessoasTurma, PessoaTurma } from '@/hooks/use-pessoas-turma';
import { supabase } from "@/integrations/supabase/client";
import { Turma } from '@/hooks/use-professor-turmas';
import { toast } from '@/hooks/use-toast';
import { useProdutividade } from '@/hooks/use-produtividade';
import ProdutividadeModal from '@/components/turmas/ProdutividadeModal';
import ReposicaoAulaModal from '@/components/turmas/ReposicaoAulaModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const ProdutividadeTurma = () => {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const dia = location.state?.dia;
  const alunosCarregadosRef = useRef(false);
  
  const ultimaDataVerificadaRef = useRef<string>('');
  
  const [loading, setLoading] = useState(true);
  const [turma, setTurma] = useState<Turma | null>(null);
  const [alunoSelecionado, setAlunoSelecionado] = useState<PessoaTurma | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [reposicaoModalAberto, setReposicaoModalAberto] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [alunoParaExcluir, setAlunoParaExcluir] = useState<PessoaTurma | null>(null);

  const { 
    pessoasTurma: alunos, 
    todasPessoas: todosAlunos, 
    produtividadeRegistrada, 
    dataRegistroProdutividade,
    carregandoPessoas: carregandoAlunos,
    atualizarProdutividadeRegistrada,
    buscarPessoasPorTurma,
    recarregarDadosAposExclusao
  } = usePessoasTurma();

  // Usar hook sem pessoaId específico para exclusão
  const { excluirProdutividade, isLoading: excluindoProdutividade } = useProdutividade();

  useEffect(() => {
    const fetchTurma = async () => {
      try {
        if (!params.turmaId) return;
        
        const { data, error } = await supabase
          .from('turmas')
          .select('*')
          .eq('id', params.turmaId)
          .single();

        if (error) throw error;
        
        if (data) {
          const turmaData: Turma = {
            ...data,
            sala: data.sala || ''
          };
          
          setTurma(turmaData);
          
          if (!alunosCarregadosRef.current) {
            console.log("Carregando pessoas pela primeira vez para a turma:", data.id);
            await buscarPessoasPorTurma(data.id);
            alunosCarregadosRef.current = true;
          }
        }
      } catch (error) {
        console.error('Erro ao buscar turma:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados da turma",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTurma();
    
    return () => {
      alunosCarregadosRef.current = false;
    };
  }, [params.turmaId, buscarPessoasPorTurma]);

  useEffect(() => {
    const hoje = new Date().toISOString().split('T')[0];
    
    if (hoje !== ultimaDataVerificadaRef.current && turma && alunosCarregadosRef.current) {
      console.log("Verificando produtividade para nova data:", hoje);
      buscarPessoasPorTurma(turma.id);
      ultimaDataVerificadaRef.current = hoje;
    }
  }, [turma, buscarPessoasPorTurma, dataRegistroProdutividade]);

  const voltarParaTurmas = () => {
    navigate('/turmas/dia', { 
      state: { 
        dia,
        serviceType: 'produtividade'
      }
    });
  };

  const handleClickRegistrarPresenca = (aluno: PessoaTurma) => {
    setAlunoSelecionado(aluno);
    setModalAberto(true);
  };
  
  const handleFecharModal = () => {
    setModalAberto(false);
    setAlunoSelecionado(null);
  };

  const handleReposicaoAula = () => {
    setReposicaoModalAberto(true);
  };

  const handleFecharReposicaoModal = () => {
    setReposicaoModalAberto(false);
  };

  const handleSuccessModal = (alunoId: string) => {
    atualizarProdutividadeRegistrada(alunoId, true);
  };

  const handleClickExcluirRegistro = (aluno: PessoaTurma) => {
    console.log('🔍 handleClickExcluirRegistro: Dados do aluno recebidos:', {
      id: aluno.id,
      nome: aluno.nome,
      ultimo_registro_id: aluno.ultimo_registro_id,
      data_ultimo_registro: aluno.data_ultimo_registro
    });
    
    if (!aluno.ultimo_registro_id) {
      console.error('❌ handleClickExcluirRegistro: ultimo_registro_id não disponível');
      toast({
        title: "Erro",
        description: "ID do registro não encontrado. Não é possível excluir.",
        variant: "destructive"
      });
      return;
    }
    
    setAlunoParaExcluir(aluno);
    setConfirmDialogOpen(true);
  };

  const handleConfirmExclusao = async () => {
    if (!alunoParaExcluir || !alunoParaExcluir.ultimo_registro_id) {
      console.error('❌ handleConfirmExclusao: Dados insuficientes para exclusão:', { 
        alunoParaExcluir: alunoParaExcluir?.nome, 
        registroId: alunoParaExcluir?.ultimo_registro_id 
      });
      toast({
        title: "Erro",
        description: "Dados insuficientes para exclusão",
        variant: "destructive"
      });
      setConfirmDialogOpen(false);
      return;
    }
    
    try {
      console.log('🔄 handleConfirmExclusao: Tentando excluir registro:', alunoParaExcluir.ultimo_registro_id, 'do aluno:', alunoParaExcluir.nome);
      
      const sucesso = await excluirProdutividade(alunoParaExcluir.ultimo_registro_id);
      
      if (sucesso) {
        console.log('✅ handleConfirmExclusao: Exclusão bem-sucedida, atualizando estado local');
        
        // Atualizar o estado local primeiro
        if (produtividadeRegistrada[alunoParaExcluir.id]) {
          atualizarProdutividadeRegistrada(alunoParaExcluir.id, false);
        }
        
        // Recarregar os dados da turma
        recarregarDadosAposExclusao(alunoParaExcluir.id);
        
        toast({
          title: "Sucesso",
          description: `Registro de ${alunoParaExcluir.nome} excluído com sucesso!`,
        });
      }
    } catch (error) {
      console.error('❌ handleConfirmExclusao: Erro ao excluir registro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o registro",
        variant: "destructive"
      });
    }
    
    setConfirmDialogOpen(false);
    setAlunoParaExcluir(null);
  };

  const handleModalError = (errorMessage: string) => {
    if (errorMessage.includes("credenciais do Google") || 
        errorMessage.includes("Google Service Account")) {
      toast({
        title: "Erro de configuração",
        description: "Configuração incompleta: O administrador precisa configurar as credenciais do Google Service Account",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  if (loading || carregandoAlunos || excluindoProdutividade) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-orange-950 dark:to-slate-950 text-azul-500 dark:text-orange-100">
        <div className="container mx-auto py-4 px-2 text-center">
          <p>Carregando{carregandoAlunos ? ' pessoas' : excluindoProdutividade ? ' excluindo registro' : ''}...</p>
        </div>
      </div>
    );
  }

  if (!turma) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-orange-950 dark:to-slate-950 text-azul-500 dark:text-orange-100">
        <div className="container mx-auto py-4 px-2 text-center">
          <p>Turma não encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-orange-950 dark:to-slate-950 text-azul-500 dark:text-orange-100">
      <div className="container mx-auto py-4 px-2">
        <ProdutividadeScreen
          turma={turma}
          alunos={alunos}
          onBack={voltarParaTurmas}
          onRegistrarPresenca={handleClickRegistrarPresenca}
          onExcluirRegistro={handleClickExcluirRegistro}
          onReposicaoAula={handleReposicaoAula}
          produtividadeRegistrada={produtividadeRegistrada}
        />
        
        {alunoSelecionado && (
          <ProdutividadeModal 
            isOpen={modalAberto} 
            aluno={alunoSelecionado} 
            turma={turma} 
            onClose={handleFecharModal} 
            onSuccess={handleSuccessModal}
            onError={handleModalError}
          />
        )}

        <ReposicaoAulaModal 
          isOpen={reposicaoModalAberto}
          turma={turma}
          todosAlunos={todosAlunos}
          onClose={handleFecharReposicaoModal}
          onError={handleModalError}
        />

        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir registro</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o último registro de produtividade de {alunoParaExcluir?.nome}? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmExclusao} 
                className="bg-red-600 hover:bg-red-700"
                disabled={excluindoProdutividade}
              >
                {excluindoProdutividade ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default ProdutividadeTurma;
