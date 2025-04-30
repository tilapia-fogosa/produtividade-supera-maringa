
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTodasTurmas } from '@/hooks/use-todas-turmas';
import DiarioTurmaScreen from '@/components/turmas/turma-detail/DiarioTurmaScreen';
import { useTurmaDetalhes } from '@/hooks/use-turma-detalhes';
import { useNavigate } from 'react-router-dom';
import { usePessoasTurma } from '@/hooks/use-pessoas-turma';

const DiarioPage = () => {
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("");
  const navigate = useNavigate();
  
  // Data atual fixa para simplificar
  const date = new Date();
  
  // Hook customizado para buscar todas as turmas
  const { turmas, loading: turmasLoading, error } = useTodasTurmas();
  
  // Hook para buscar detalhes da turma selecionada
  const { turma } = useTurmaDetalhes(selectedTurmaId);

  // Hook para buscar pessoas (alunos e funcionários)
  const { pessoasTurma, buscarPessoasPorTurma } = usePessoasTurma();

  // Buscar pessoas quando a turma é selecionada
  useEffect(() => {
    if (selectedTurmaId) {
      buscarPessoasPorTurma(selectedTurmaId);
    }
  }, [selectedTurmaId, buscarPessoasPorTurma]);

  // Função para navegar para a tela de turmas no dia selecionado
  const handleVerTodasTurmas = () => {
    navigate('/turmas/dia', { 
      state: { 
        serviceType: 'diario_turma',
        data: date
      }
    });
  };

  return (
    <div className="container mx-auto p-4 bg-[#1A1F2C] min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-laranja-DEFAULT">Diário de Turma</h1>
      
      <Card className="border-laranja-DEFAULT bg-white p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Turma Select */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-laranja-DEFAULT mb-2">
              Turma
            </label>
            <Select value={selectedTurmaId} onValueChange={setSelectedTurmaId}>
              <SelectTrigger className="bg-white border-laranja-DEFAULT">
                <SelectValue placeholder="Selecione uma turma" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {turmasLoading ? (
                  <SelectItem disabled value="loading">Carregando turmas...</SelectItem>
                ) : error ? (
                  <SelectItem disabled value="error">Erro ao carregar turmas</SelectItem>
                ) : turmas.length === 0 ? (
                  <SelectItem disabled value="empty">Nenhuma turma encontrada</SelectItem>
                ) : (
                  turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.nome} - {turma.horario.substring(0, 5)} ({turma.dia_semana})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button 
            variant="outline"
            onClick={handleVerTodasTurmas}
            className="text-laranja-DEFAULT border-laranja-DEFAULT hover:bg-laranja-DEFAULT/10"
          >
            Ver todas turmas do dia
          </Button>
        </div>
      </Card>

      {/* Render DiarioTurmaScreen when turma is selected */}
      {selectedTurmaId && turma && (
        <DiarioTurmaScreen
          turma={turma}
          alunos={pessoasTurma}
          onBack={() => setSelectedTurmaId("")}
        />
      )}
    </div>
  );
};

export default DiarioPage;
