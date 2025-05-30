
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, User, Search } from "lucide-react";
import { useAlunos } from '@/hooks/use-alunos';

const AlunosDevolutivas = () => {
  const navigate = useNavigate();
  const { todosAlunos, carregando } = useAlunos();
  const [filtro, setFiltro] = useState('');

  const alunosFiltrados = useMemo(() => {
    if (!filtro.trim()) return todosAlunos;
    
    return todosAlunos.filter(aluno =>
      aluno.nome.toLowerCase().includes(filtro.toLowerCase())
    );
  }, [todosAlunos, filtro]);

  const handleVoltar = () => {
    navigate('/devolutivas');
  };

  const handleAbrirDevolutiva = (alunoId: string) => {
    navigate(`/devolutivas/aluno/${alunoId}`);
  };

  if (carregando) {
    return (
      <div className="text-center p-6 bg-background dark:bg-background">
        <p>Carregando lista de alunos...</p>
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
        Lista Geral de Alunos - Devolutivas
      </h1>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Filtrar alunos por nome..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="pl-10 border-orange-200"
          />
        </div>
        {filtro && (
          <p className="text-sm text-gray-500 mt-2">
            Mostrando {alunosFiltrados.length} de {todosAlunos.length} alunos
          </p>
        )}
      </div>
      
      <div className="space-y-3">
        {alunosFiltrados.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 p-4">
            {filtro 
              ? 'Nenhum aluno encontrado com esse nome.' 
              : 'Nenhum aluno encontrado.'}
          </p>
        ) : (
          alunosFiltrados.map((aluno) => (
            <div 
              key={aluno.id}
              className="p-4 border rounded-lg border-blue-200 bg-white dark:bg-card hover:bg-blue-50 dark:hover:bg-card/80 cursor-pointer transition-colors"
              onClick={() => handleAbrirDevolutiva(aluno.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-blue-500" />
                  <div>
                    <h3 className="text-md font-medium text-azul-500 dark:text-orange-100">
                      {aluno.nome}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {aluno.data_onboarding 
                        ? `Onboarding: ${new Date(aluno.data_onboarding).toLocaleDateString('pt-BR')}`
                        : 'Sem data de onboarding'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAbrirDevolutiva(aluno.id);
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
