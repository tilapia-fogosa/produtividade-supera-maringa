import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, ClipboardList, Calculator } from "lucide-react";
import { AlunoSelectorModal } from '@/components/projeto-sao-rafael/AlunoSelectorModal';
import AhLancamentoModal from '@/components/turmas/AhLancamentoModal';
import AbacoLancamentoModal from '@/components/projeto-sao-rafael/AbacoLancamentoModal';

const ProjetoSaoRafaelLancamento = () => {
  const navigate = useNavigate();
  
  // Estado para AH
  const [isAlunoSelectorAhOpen, setIsAlunoSelectorAhOpen] = useState(false);
  const [isAhModalOpen, setIsAhModalOpen] = useState(false);
  const [alunoAh, setAlunoAh] = useState<{ id: string; nome: string; turma_nome: string } | null>(null);

  // Estado para Ábaco
  const [isAlunoSelectorAbacoOpen, setIsAlunoSelectorAbacoOpen] = useState(false);
  const [isAbacoModalOpen, setIsAbacoModalOpen] = useState(false);
  const [alunoAbaco, setAlunoAbaco] = useState<{ id: string; nome: string; turma_nome: string } | null>(null);

  // Handlers AH
  const handleSelectAlunoAh = (aluno: { id: string; nome: string; turma_nome: string }) => {
    setAlunoAh(aluno);
    setIsAlunoSelectorAhOpen(false);
    setIsAhModalOpen(true);
  };

  const handleCloseAhModal = () => {
    setIsAhModalOpen(false);
    setAlunoAh(null);
  };

  // Handlers Ábaco
  const handleSelectAlunoAbaco = (aluno: { id: string; nome: string; turma_nome: string }) => {
    setAlunoAbaco(aluno);
    setIsAlunoSelectorAbacoOpen(false);
    setIsAbacoModalOpen(true);
  };

  const handleCloseAbacoModal = () => {
    setIsAbacoModalOpen(false);
    setAlunoAbaco(null);
  };

  const cards = [
    {
      title: 'Devolutiva Mensal',
      description: 'Acesse o relatório mensal do Projeto São Rafael com dados de Ábaco e Abrindo Horizontes.',
      buttonLabel: 'Ver Devolutiva',
      icon: GraduationCap,
      buttonClass: 'bg-azul-500 hover:bg-azul-600 text-white',
      onClick: () => navigate('/projeto-sao-rafael-devolutiva'),
    },
    {
      title: 'Lançar Abrindo Horizontes',
      description: 'Realize o lançamento de exercícios de Abrindo Horizontes para alunos do projeto.',
      buttonLabel: 'Lançar AH',
      icon: BookOpen,
      buttonClass: 'bg-orange-500 hover:bg-orange-600 text-white',
      onClick: () => setIsAlunoSelectorAhOpen(true),
    },
    {
      title: 'Lançar Ábaco',
      description: 'Realize o lançamento de produtividade de Ábaco para alunos do projeto.',
      buttonLabel: 'Lançar Ábaco',
      icon: Calculator,
      buttonClass: 'bg-azul-500 hover:bg-azul-600 text-white',
      onClick: () => setIsAlunoSelectorAbacoOpen(true),
    },
    {
      title: 'Diários',
      description: 'Consulte todas as produtividades de Ábaco e AH de um aluno por período.',
      buttonLabel: 'Ver Diários',
      icon: ClipboardList,
      buttonClass: 'bg-azul-500 hover:bg-azul-600 text-white',
      onClick: () => navigate('/diarios-sao-rafael'),
    },
  ];

  return (
    <div className="container mx-auto py-4 px-2">
      <h1 className="text-2xl font-bold mb-6 text-azul-500">Projeto São Rafael</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="border-orange-200 bg-white flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-azul-500">{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-sm text-muted-foreground mb-4 flex-1">
                {card.description}
              </p>
              <Button 
                onClick={card.onClick}
                className={`w-full ${card.buttonClass}`}
              >
                <card.icon className="mr-2 h-4 w-4" />
                {card.buttonLabel}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Seleção de Aluno para AH */}
      <AlunoSelectorModal
        isOpen={isAlunoSelectorAhOpen}
        onClose={() => setIsAlunoSelectorAhOpen(false)}
        onSelectAluno={handleSelectAlunoAh}
        tipo="ah"
      />

      {/* Modal de Seleção de Aluno para Ábaco */}
      <AlunoSelectorModal
        isOpen={isAlunoSelectorAbacoOpen}
        onClose={() => setIsAlunoSelectorAbacoOpen(false)}
        onSelectAluno={handleSelectAlunoAbaco}
        tipo="abaco"
      />

      {/* Modal de Lançamento AH */}
      {alunoAh && (
        <AhLancamentoModal
          isOpen={isAhModalOpen}
          aluno={alunoAh}
          onClose={handleCloseAhModal}
          onSuccess={handleCloseAhModal}
          onError={(error) => console.error('Erro ao lançar AH:', error)}
        />
      )}

      {/* Modal de Lançamento Ábaco */}
      {alunoAbaco && (
        <AbacoLancamentoModal
          isOpen={isAbacoModalOpen}
          aluno={alunoAbaco}
          onClose={handleCloseAbacoModal}
          onSuccess={handleCloseAbacoModal}
        />
      )}
    </div>
  );
};

export default ProjetoSaoRafaelLancamento;
