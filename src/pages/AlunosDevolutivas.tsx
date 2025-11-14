
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, User, Search, Users } from "lucide-react";
import { useAlunos } from '@/hooks/use-alunos';
import { useFuncionarios } from '@/hooks/use-funcionarios';

const AlunosDevolutivas = () => {
  const navigate = useNavigate();
  const { todosAlunos, carregando: carregandoAlunos } = useAlunos();
  const { funcionarios, loading: carregandoFuncionarios } = useFuncionarios();
  const [filtro, setFiltro] = useState('');

  // Filtrar apenas funcionários que estão vinculados a alguma turma
  const funcionariosComTurma = useMemo(() => {
    return funcionarios.filter(funcionario => funcionario.turma_id !== null);
  }, [funcionarios]);

  // Combinar alunos e funcionários para exibição
  const pessoasFiltradas = useMemo(() => {
    const todasPessoas = [
      ...todosAlunos.map(aluno => ({
        ...aluno,
        tipo: 'aluno' as const
      })),
      ...funcionariosComTurma.map(funcionario => ({
        ...funcionario,
        tipo: 'funcionario' as const,
        data_onboarding: funcionario.data_onboarding || null
      }))
    ];

    if (!filtro.trim()) return todasPessoas;
    
    return todasPessoas.filter(pessoa =>
      pessoa.nome.toLowerCase().includes(filtro.toLowerCase())
    );
  }, [todosAlunos, funcionariosComTurma, filtro]);

  const handleVoltar = () => {
    navigate('/devolutivas');
  };

  const handleAbrirDevolutiva = (pessoa: any) => {
    if (pessoa.tipo === 'aluno') {
      navigate(`/devolutivas/aluno/${pessoa.id}`);
    } else {
      navigate(`/devolutivas/funcionario/${pessoa.id}`);
    }
  };

  if (carregandoAlunos || carregandoFuncionarios) {
    return (
      <div className="text-center p-6 bg-background dark:bg-background">
        <p>Carregando lista...</p>
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
        Lista Geral - Devolutivas
      </h1>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Filtrar por nome..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="pl-10 border-orange-200"
          />
        </div>
        {filtro && (
          <p className="text-sm text-gray-500 mt-2">
            Mostrando {pessoasFiltradas.length} de {todosAlunos.length + funcionariosComTurma.length} pessoas
          </p>
        )}
        <div className="flex gap-4 mt-2 text-sm text-gray-600">
          <span>Alunos: {todosAlunos.length}</span>
          <span>Funcionários: {funcionariosComTurma.length}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        {pessoasFiltradas.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 p-4">
            {filtro 
              ? 'Nenhuma pessoa encontrada com esse nome.' 
              : 'Nenhuma pessoa encontrada.'}
          </p>
        ) : (
          pessoasFiltradas.map((pessoa) => (
            <div 
              key={`${pessoa.tipo}-${pessoa.id}`}
              className="p-4 border rounded-lg border-blue-200 bg-white dark:bg-card hover:bg-blue-50 dark:hover:bg-card/80 cursor-pointer transition-colors"
              onClick={() => handleAbrirDevolutiva(pessoa)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {pessoa.tipo === 'aluno' ? (
                    <User className="h-5 w-5 text-blue-500" />
                  ) : (
                    <Users className="h-5 w-5 text-green-500" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-md font-medium text-azul-500 dark:text-orange-100">
                        {pessoa.nome}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        pessoa.tipo === 'aluno' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {pessoa.tipo === 'aluno' ? 'Aluno' : 'Funcionário'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {pessoa.data_onboarding 
                        ? `Onboarding: ${new Date(pessoa.data_onboarding).toLocaleDateString('pt-BR')}`
                        : 'Sem data de onboarding'}
                    </p>
                    {pessoa.tipo === 'funcionario' && pessoa.turma && (
                      <p className="text-xs text-gray-400">
                        Turma: {pessoa.turma.nome}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAbrirDevolutiva(pessoa);
                  }}
                >
                  Ver Devolutiva
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlunosDevolutivas;
