import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import ProdutividadeScreen from '@/components/turmas/turma-detail/ProdutividadeScreen';
import { useAlunos } from '@/hooks/use-alunos';
import { supabase } from "@/integrations/supabase/client";
import { Turma } from '@/hooks/use-turmas-por-dia';
import { toast } from '@/hooks/use-toast';
import { Aluno } from '@/hooks/use-professor-turmas';
import ProdutividadeModal from '@/components/turmas/ProdutividadeModal';

const ProdutividadeTurma = () => {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const dia = location.state?.dia;
  
  const [loading, setLoading] = useState(true);
  const [turma, setTurma] = useState<Turma | null>(null);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  
  const { 
    alunos, 
    handleTurmaSelecionada, 
    handleRegistrarPresenca,
    produtividadeRegistrada,
    carregandoAlunos,
    atualizarProdutividadeRegistrada
  } = useAlunos();

  // Efeito para buscar os detalhes da turma
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
          setTurma(data as Turma);
          
          // Iniciar carregamento dos alunos assim que tivermos os dados da turma
          handleTurmaSelecionada(data.id);
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
  }, [params.turmaId]);

  const voltarParaTurmas = () => {
    navigate('/turmas/dia', { 
      state: { 
        dia,
        serviceType: 'produtividade'
      }
    });
  };

  // Função para abrir o modal de produtividade
  const handleClickRegistrarPresenca = (aluno: Aluno) => {
    setAlunoSelecionado(aluno);
    setModalAberto(true);
  };
  
  // Função para fechar o modal
  const handleFecharModal = () => {
    setModalAberto(false);
    setAlunoSelecionado(null);
  };

  const handleSuccessModal = (alunoId: string) => {
    atualizarProdutividadeRegistrada(alunoId);
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
          turma={turma!}
          alunos={alunos}
          onBack={voltarParaTurmas}
          onRegistrarPresenca={handleClickRegistrarPresenca}
          produtividadeRegistrada={produtividadeRegistrada}
        />
        
        {alunoSelecionado && (
          <ProdutividadeModal 
            isOpen={modalAberto} 
            aluno={alunoSelecionado} 
            turma={turma!} 
            onClose={handleFecharModal} 
            onSuccess={handleSuccessModal}
          />
        )}
      </div>
    </div>
  );
};

export default ProdutividadeTurma;
