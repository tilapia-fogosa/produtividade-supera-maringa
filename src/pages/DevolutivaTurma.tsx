
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AlunoDevolutiva } from '@/hooks/use-devolutivas';

const DevolutivaTurma = () => {
  const { turmaId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [turma, setTurma] = useState<{ id: string; nome: string } | null>(null);
  const [alunos, setAlunos] = useState<AlunoDevolutiva[]>([]);

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        // Buscar informações da turma
        const { data: turmaData, error: turmaError } = await supabase
          .from('turmas')
          .select('id, nome')
          .eq('id', turmaId)
          .single();

        if (turmaError) {
          console.error('Erro ao buscar turma:', turmaError);
          return;
        }

        setTurma(turmaData);

        // Buscar alunos da turma
        const { data: alunosData, error: alunosError } = await supabase
          .from('alunos')
          .select('id, nome, texto_devolutiva')
          .eq('turma_id', turmaId)
          .eq('active', true);

        if (alunosError) {
          console.error('Erro ao buscar alunos:', alunosError);
          return;
        }

        setAlunos(alunosData || []);

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    if (turmaId) {
      carregarDados();
    }
  }, [turmaId]);

  const handleVoltar = () => {
    navigate('/devolutivas/turmas');
  };

  if (loading) {
    return (
      <div className="text-center p-6">
        <p>Carregando dados da turma...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-2">
      <Button 
        onClick={handleVoltar} 
        variant="outline" 
        className="mb-4 text-azul-500 border-orange-200"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>
      
      <h1 className="text-xl font-bold mb-4 text-azul-500">
        Lista de Alunos - {turma?.nome}
      </h1>
      
      <div className="space-y-4">
        {alunos.length === 0 ? (
          <p className="text-center text-gray-500 p-4">
            Nenhum aluno encontrado nesta turma.
          </p>
        ) : (
          alunos.map((aluno) => (
            <div 
              key={aluno.id} 
              className="p-4 border rounded-lg border-orange-200 bg-white hover:bg-orange-50 cursor-pointer transition-colors"
              onClick={() => navigate(`/devolutivas/aluno/${aluno.id}`)}
            >
              <h3 className="text-md text-azul-500">{aluno.nome}</h3>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DevolutivaTurma;
