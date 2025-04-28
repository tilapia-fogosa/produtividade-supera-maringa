
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import ProdutividadeScreen from '@/components/turmas/turma-detail/ProdutividadeScreen';
import { useAlunos } from '@/hooks/use-alunos';
import { supabase } from "@/integrations/supabase/client";
import { Aluno, Turma } from '@/hooks/use-professor-turmas';
import { toast } from '@/hooks/use-toast';
import ProdutividadeModal from '@/components/turmas/ProdutividadeModal';
import ReposicaoAulaModal from '@/components/turmas/ReposicaoAulaModal';

const ProdutividadeTurma = () => {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const dia = location.state?.dia;
  const alunosCarregadosRef = useRef(false);
  
  const [loading, setLoading] = useState(true);
  const [turma, setTurma] = useState<Turma | null>(null);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [reposicaoModalAberto, setReposicaoModalAberto] = useState(false);
  // Referência para controlar a data última verificada
  const ultimaDataVerificadaRef = useRef<string>('');

  const { 
    alunos, 
    todosAlunos,
    produtividadeRegistrada,
    dataRegistroProdutividade,
    carregandoAlunos,
    atualizarProdutividadeRegistrada,
    buscarAlunosPorTurma
  } = useAlunos();

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
          
          // Carregamos os alunos apenas uma vez quando a turma é carregada
          if (!alunosCarregadosRef.current) {
            console.log("Carregando alunos pela primeira vez para a turma:", data.id);
            await buscarAlunosPorTurma(data.id);
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
    
    // Limpa o estado ao desmontar
    return () => {
      alunosCarregadosRef.current = false;
    };
  }, [params.turmaId, buscarAlunosPorTurma]);

  // Efeito separado para verificar mudanças na data
  useEffect(() => {
    // Verificar se a data mudou e se precisamos atualizar
    const hoje = new Date().toISOString().split('T')[0];
    
    // Só recarrega se: a data de hoje for diferente da última data de verificação,
    // a turma estiver carregada e os alunos já foram carregados pelo menos uma vez
    if (hoje !== ultimaDataVerificadaRef.current && turma && alunosCarregadosRef.current) {
      console.log("Verificando produtividade para nova data:", hoje);
      buscarAlunosPorTurma(turma.id);
      ultimaDataVerificadaRef.current = hoje;
    }
  }, [turma, buscarAlunosPorTurma, dataRegistroProdutividade]);

  const voltarParaTurmas = () => {
    navigate('/turmas/dia', { 
      state: { 
        dia,
        serviceType: 'produtividade'
      }
    });
  };

  const handleClickRegistrarPresenca = (aluno: Aluno) => {
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

  if (loading || carregandoAlunos) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-orange-950 dark:to-slate-950 text-azul-500 dark:text-orange-100">
        <div className="container mx-auto py-4 px-2 text-center">
          <p>Carregando{carregandoAlunos ? ' alunos' : ''}...</p>
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
          alunos={alunos as Aluno[]}
          onBack={voltarParaTurmas}
          onRegistrarPresenca={handleClickRegistrarPresenca}
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
          todosAlunos={todosAlunos as Aluno[]}
          onClose={handleFecharReposicaoModal}
          onError={handleModalError}
        />
      </div>
    </div>
  );
};

export default ProdutividadeTurma;
