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

  const irParaDevolutiva = () => {
    navigate('/projeto-sao-rafael-devolutiva');
  };

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

  return (
    <div className="container mx-auto py-4 px-2">
      <h1 className="text-2xl font-bold mb-6 text-azul-500">Projeto São Rafael</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-orange-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-azul-500">Devolutiva Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Acesse o relatório mensal do Projeto São Rafael com dados de Ábaco e Abrindo Horizontes.
            </p>
            <Button 
              onClick={irParaDevolutiva}
              className="w-full bg-azul-500 hover:bg-azul-600 text-white"
            >
              <GraduationCap className="mr-2 h-4 w-4" />
              Ver Devolutiva
            </Button>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-azul-500">Lançar Abrindo Horizontes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Realize o lançamento de exercícios de Abrindo Horizontes para alunos do projeto.
            </p>
            <Button 
              onClick={() => setIsAlunoSelectorAhOpen(true)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Lançar AH
            </Button>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-azul-500">Lançar Ábaco</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Realize o lançamento de produtividade de Ábaco para alunos do projeto.
            </p>
            <Button 
              onClick={() => setIsAlunoSelectorAbacoOpen(true)}
              className="w-full bg-azul-500 hover:bg-azul-600 text-white"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Lançar Ábaco
            </Button>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-azul-500">Diários</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Consulte todas as produtividades de Ábaco e AH de um aluno por período.
            </p>
            <Button 
              onClick={() => navigate('/diarios-sao-rafael')}
              className="w-full bg-azul-500 hover:bg-azul-600 text-white"
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Ver Diários
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Seleção de Aluno para AH */}
      <AlunoSelectorModal
        isOpen={isAlunoSelectorAhOpen}
        onClose={() => setIsAlunoSelectorAhOpen(false)}
        onSelectAluno={handleSelectAlunoAh}
      />

      {/* Modal de Seleção de Aluno para Ábaco */}
      <AlunoSelectorModal
        isOpen={isAlunoSelectorAbacoOpen}
        onClose={() => setIsAlunoSelectorAbacoOpen(false)}
        onSelectAluno={handleSelectAlunoAbaco}
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
