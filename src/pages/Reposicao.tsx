
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTodasTurmas } from '@/hooks/use-todas-turmas';
import { useAlunos } from '@/hooks/use-alunos';
import ReposicaoAulaModal from '@/components/turmas/ReposicaoAulaModal';
import { Turma } from '@/hooks/use-professor-turmas';

const Reposicao = () => {
  const navigate = useNavigate();
  const { turmas, loading } = useTodasTurmas();
  const { todosAlunos } = useAlunos();
  const [turmaSelecionada, setTurmaSelecionada] = useState<Turma | null>(null);

  const handleVoltar = () => {
    navigate('/lancamentos');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Carregando turmas...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Button 
        onClick={handleVoltar} 
        variant="outline" 
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <h1 className="text-2xl font-bold mb-6">Reposição de Aula</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {turmas.map((turma) => (
          <Card 
            key={turma.id}
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setTurmaSelecionada(turma)}
          >
            <h3 className="font-semibold">{turma.nome}</h3>
            <p className="text-sm text-gray-600">{turma.horario}</p>
            {turma.sala && <p className="text-sm text-gray-600">Sala: {turma.sala}</p>}
          </Card>
        ))}
      </div>

      {turmaSelecionada && (
        <ReposicaoAulaModal
          isOpen={true}
          turma={turmaSelecionada}
          todosAlunos={todosAlunos}
          onClose={() => setTurmaSelecionada(null)}
        />
      )}
    </div>
  );
};

export default Reposicao;
