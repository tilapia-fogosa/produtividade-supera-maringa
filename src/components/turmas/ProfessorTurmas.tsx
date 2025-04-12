
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import TurmasList from './TurmasList';
import TurmaDetail from './TurmaDetail';
import AlunoDetail from './AlunoDetail';

interface Professor {
  id: string;
  nome: string;
}

interface Turma {
  id: string;
  nome: string;
  dia_semana: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo';
  horario: string;
}

interface Aluno {
  id: string;
  nome: string;
  turma_id: string;
  codigo?: string | null;
  telefone?: string | null;
  email?: string | null;
  curso?: string | null;
  matricula?: string | null;
  idade?: number | null;
  ultimo_nivel?: string | null;
  dias_apostila?: number | null;
  dias_supera?: number | null;
  vencimento_contrato?: string | null;
}

const ProfessorTurmas = () => {
  const { professorId } = useParams<{ professorId: string }>();
  const navigate = useNavigate();
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [alunoDetalhes, setAlunoDetalhes] = useState<Aluno | null>(null);

  useEffect(() => {
    const fetchProfessorETurmas = async () => {
      try {
        setLoading(true);
        
        // Buscar informações do professor
        const { data: professorData, error: professorError } = await supabase
          .from('professores')
          .select('id, nome')
          .eq('id', professorId)
          .single();

        if (professorError) {
          throw professorError;
        }

        setProfessor(professorData);

        // Buscar turmas do professor
        const { data: turmasData, error: turmasError } = await supabase
          .from('turmas')
          .select('*')
          .eq('professor_id', professorId)
          .order('dia_semana, horario');

        if (turmasError) {
          throw turmasError;
        }

        setTurmas(turmasData || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do professor e turmas.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (professorId) {
      fetchProfessorETurmas();
    }
  }, [professorId]);

  const handleVoltar = () => {
    navigate('/');
  };

  const handleTurmaSelecionada = async (turmaId: string) => {
    setTurmaSelecionada(turmaId);
    setAlunoDetalhes(null);
    
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('turma_id', turmaId)
        .order('nome');
        
      if (error) {
        throw error;
      }
      
      setAlunos(data || []);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de alunos.",
        variant: "destructive"
      });
    }
  };

  const handleRegistrarPresenca = (alunoId: string) => {
    // Implementação futura
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O registro de presença será implementado em breve.",
    });
  };

  const mostrarDetalhesAluno = (aluno: Aluno) => {
    setAlunoDetalhes(aluno);
  };

  const fecharDetalhesAluno = () => {
    setAlunoDetalhes(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button 
        onClick={handleVoltar} 
        variant="outline" 
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">{professor?.nome}</CardTitle>
          <CardDescription>
            {turmas.length} turma{turmas.length !== 1 ? 's' : ''} encontrada{turmas.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {turmas.length === 0 ? (
            <div className="text-center py-4">
              <p>Não há turmas cadastradas para este(a) professor(a).</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {!turmaSelecionada ? (
                // Lista de turmas
                <TurmasList 
                  turmas={turmas} 
                  onTurmaSelecionada={handleTurmaSelecionada} 
                />
              ) : alunoDetalhes ? (
                // Detalhes do aluno
                <AlunoDetail 
                  aluno={alunoDetalhes} 
                  onVoltar={fecharDetalhesAluno} 
                />
              ) : (
                // Lista de alunos da turma selecionada
                <TurmaDetail
                  turma={turmas.find(t => t.id === turmaSelecionada)!}
                  alunos={alunos}
                  onVoltar={() => setTurmaSelecionada(null)}
                  onShowAlunoDetails={mostrarDetalhesAluno}
                  onRegistrarPresenca={handleRegistrarPresenca}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessorTurmas;
