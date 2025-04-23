
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
import { useTurmasPorDia } from '@/hooks/use-turmas-por-dia';
import DiarioTurmaScreen from '@/components/turmas/turma-detail/DiarioTurmaScreen';
import { useTurmaDetalhes } from '@/hooks/use-turma-detalhes';

const DiarioPage = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("");
  
  // Hook customizado para buscar todas as turmas
  const { turmas, loading: turmasLoading } = useTurmasPorDia();
  
  // Hook para buscar detalhes da turma selecionada
  const { turma, alunos } = useTurmaDetalhes(selectedTurmaId);

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
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  className={cn("p-3 pointer-events-auto")}
                  locale={ptBR}
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
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma turma" />
              </SelectTrigger>
              <SelectContent>
                {turmas.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.nome} - {turma.horario.substring(0, 5)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
