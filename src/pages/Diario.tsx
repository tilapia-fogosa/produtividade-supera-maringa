
import React, { useState } from 'react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTodasTurmas } from '@/hooks/use-todas-turmas';
import DiarioTurmaScreen from '@/components/turmas/turma-detail/DiarioTurmaScreen';
import { useTurmaDetalhes } from '@/hooks/use-turma-detalhes';
import { useNavigate } from 'react-router-dom';

const DiarioPage = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("");
  const navigate = useNavigate();
  
  // Hook customizado para buscar todas as turmas
  const { turmas, loading: turmasLoading, error } = useTodasTurmas();
  
  // Hook para buscar detalhes da turma selecionada
  const { turma, alunos } = useTurmaDetalhes(selectedTurmaId);

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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-azul-500">Diário de Turma</h1>
      
      <Card className="border-orange-200 bg-white p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Date Picker */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-azul-500 mb-2">
              Data
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? (
                    format(date, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50 bg-white" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Turma Select */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-azul-500 mb-2">
              Turma
            </label>
            <Select value={selectedTurmaId} onValueChange={setSelectedTurmaId}>
              <SelectTrigger className="bg-white">
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
            className="text-azul-500 border-orange-200"
          >
            Ver todas turmas do dia
          </Button>
        </div>
      </Card>

      {/* Render DiarioTurmaScreen when both date and turma are selected */}
      {selectedTurmaId && date && turma && (
        <DiarioTurmaScreen
          turma={turma}
          alunos={alunos}
          onBack={() => setSelectedTurmaId("")}
        />
      )}
    </div>
  );
};

export default DiarioPage;
