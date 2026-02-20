
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PessoaDevolutiva } from '@/hooks/use-devolutivas';

const DevolutivaTurma = () => {
  const { turmaId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [turma, setTurma] = useState<{ id: string; nome: string } | null>(null);
  const [pessoas, setPessoas] = useState<PessoaDevolutiva[]>([]);

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

        // Buscar funcionários da turma
        const { data: funcionariosData, error: funcionariosError } = await supabase
          .from('funcionarios')
          .select('id, nome, texto_devolutiva')
          .eq('turma_id', turmaId)
          .eq('active', true);

        if (funcionariosError) {
          console.error('Erro ao buscar funcionários:', funcionariosError);
          return;
        }

        // Combinar alunos e funcionários
        const alunos: PessoaDevolutiva[] = (alunosData || []).map(aluno => ({
          ...aluno,
          tipo: 'aluno' as const
        }));

        const funcionarios: PessoaDevolutiva[] = (funcionariosData || []).map(funcionario => ({
          ...funcionario,
          tipo: 'funcionario' as const
        }));

        // Ordenar por tipo (alunos primeiro) e depois por nome
        const todasPessoas = [...alunos, ...funcionarios].sort((a, b) => {
          if (a.tipo !== b.tipo) {
            return a.tipo === 'aluno' ? -1 : 1;
          }
          return a.nome.localeCompare(b.nome);
        });

        setPessoas(todasPessoas);

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
    navigate('/devolutivas/turmas', {
      state: { 
        serviceType: 'devolutiva'
      }
    });
  };

  const getIconePessoa = (tipo: 'aluno' | 'funcionario') => {
    return tipo === 'aluno' ? (
      <User className="h-4 w-4 text-blue-500" />
    ) : (
      <Users className="h-4 w-4 text-green-500" />
    );
  };

  const getCorBorda = (tipo: 'aluno' | 'funcionario') => {
    return tipo === 'aluno' ? 'border-blue-200' : 'border-green-200';
  };

  const getCorHover = (tipo: 'aluno' | 'funcionario') => {
    return tipo === 'aluno' ? 'hover:bg-blue-50' : 'hover:bg-green-50';
  };

  if (loading) {
    return (
      <div className="text-center p-6 bg-background dark:bg-background">
        <p>Carregando dados da turma...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-2 bg-background dark:bg-background min-h-screen">
      <Button 
        onClick={handleVoltar} 
        variant="outline" 
        className="mb-4 text-azul-500 dark:text-orange-100 border-orange-200"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>
      
      <h1 className="text-xl font-bold mb-4 text-azul-500 dark:text-orange-100">
        Lista de Pessoas - {turma?.nome}
      </h1>
      
      <div className="space-y-4">
        {pessoas.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 p-4">
            Nenhuma pessoa encontrada nesta turma.
          </p>
        ) : (
          pessoas.map((pessoa) => (
            <div 
              key={`${pessoa.tipo}-${pessoa.id}`}
              className={`p-4 border rounded-lg ${getCorBorda(pessoa.tipo)} bg-white dark:bg-card ${getCorHover(pessoa.tipo)} dark:hover:bg-card/80 cursor-pointer transition-colors`}
              onClick={() => navigate(`/devolutivas/${pessoa.tipo}/${pessoa.id}`)}
            >
              <div className="flex items-center gap-2">
                {getIconePessoa(pessoa.tipo)}
                <h3 className="text-md text-azul-500 dark:text-orange-100">
                  {pessoa.nome}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  pessoa.tipo === 'aluno' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {pessoa.tipo === 'aluno' ? 'Aluno' : 'Funcionário'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DevolutivaTurma;
