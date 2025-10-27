import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen } from "lucide-react";
import { AlunoSelectorModal } from '@/components/projeto-sao-rafael/AlunoSelectorModal';
import AhLancamentoModal from '@/components/turmas/AhLancamentoModal';

const ProjetoSaoRafaelLancamento = () => {
  const navigate = useNavigate();
  const [isAlunoSelectorOpen, setIsAlunoSelectorOpen] = useState(false);
  const [isAhModalOpen, setIsAhModalOpen] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<{ id: string; nome: string; turma_nome: string } | null>(null);

  const irParaDevolutiva = () => {
    navigate('/projeto-sao-rafael-devolutiva');
  };

  const handleSelectAluno = (aluno: { id: string; nome: string; turma_nome: string }) => {
    setAlunoSelecionado(aluno);
    setIsAlunoSelectorOpen(false);
    setIsAhModalOpen(true);
  };

  const handleCloseAhModal = () => {
    setIsAhModalOpen(false);
    setAlunoSelecionado(null);
  };

  return (
    <div className="container mx-auto py-4 px-2">
      <h1 className="text-2xl font-bold mb-6 text-azul-500">Projeto São Rafael</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              onClick={() => setIsAlunoSelectorOpen(true)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Lançar AH
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Seleção de Aluno */}
      <AlunoSelectorModal
        isOpen={isAlunoSelectorOpen}
        onClose={() => setIsAlunoSelectorOpen(false)}
        onSelectAluno={handleSelectAluno}
      />

      {/* Modal de Lançamento AH */}
      {alunoSelecionado && (
        <AhLancamentoModal
          isOpen={isAhModalOpen}
          aluno={alunoSelecionado}
          onClose={handleCloseAhModal}
          onSuccess={handleCloseAhModal}
          onError={(error) => console.error('Erro ao lançar AH:', error)}
        />
      )}
    </div>
  );
};

export default ProjetoSaoRafaelLancamento;
