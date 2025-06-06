
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, User, FileText, GraduationCap } from "lucide-react";

const Devolutivas = () => {
  const navigate = useNavigate();

  const irParaTurmas = () => {
    navigate('/devolutivas/turmas', { 
      state: { serviceType: 'devolutiva' } 
    });
  };

  const irParaFichas = () => {
    navigate('/fichas');
  };

  const irParaAlunos = () => {
    navigate('/devolutivas/alunos');
  };

  const irParaProjetoSaoRafael = () => {
    navigate('/turmas', {
      state: {
        serviceType: 'projeto_sao_rafael',
        dia: 'quinta'
      }
    });
  };

  return (
    <div className="container mx-auto py-4 px-2">
      <h1 className="text-2xl font-bold mb-6 text-azul-500">Devolutivas</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-orange-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-azul-500">Por Turma</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Visualize devolutivas por turma e acesse os relatórios de cada aluno.
            </p>
            <Button 
              onClick={irParaTurmas}
              className="w-full bg-azul-500 hover:bg-azul-600 text-white"
            >
              <Users className="mr-2 h-4 w-4" />
              Ver Turmas
            </Button>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-azul-500">Por Aluno</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Acesse diretamente as devolutivas de qualquer aluno através de uma lista geral.
            </p>
            <Button 
              onClick={irParaAlunos}
              className="w-full bg-azul-500 hover:bg-azul-600 text-white"
            >
              <User className="mr-2 h-4 w-4" />
              Ver Alunos
            </Button>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-azul-500">Projeto São Rafael</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Acesse as turmas do projeto São Rafael (Prof. Gustavo - Quintas-feiras).
            </p>
            <Button 
              onClick={irParaProjetoSaoRafael}
              className="w-full bg-azul-500 hover:bg-azul-600 text-white"
            >
              <GraduationCap className="mr-2 h-4 w-4" />
              Projeto São Rafael
            </Button>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-azul-500">Fichas de Acompanhamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Gere fichas impressas para acompanhamento manual de turmas.
            </p>
            <Button 
              onClick={irParaFichas}
              className="w-full bg-azul-500 hover:bg-azul-600 text-white"
            >
              <FileText className="mr-2 h-4 w-4" />
              Gerar Fichas
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Devolutivas;
