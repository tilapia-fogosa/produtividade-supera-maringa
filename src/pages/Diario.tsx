import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from '@/integrations/supabase/client';
import DiarioTurmaAccordion from '@/components/diario/DiarioTurmaAccordion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Turma } from '@/hooks/use-professor-turmas';

type DiaSemanaEnum = 'domingo' | 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado';

// Mapeamento de dia da semana (Date) para o enum do banco
const getDiaSemanaFromDate = (date: Date): DiaSemanaEnum => {
  const diasSemana: DiaSemanaEnum[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return diasSemana[date.getDay()];
};

// Mapeamento para exibição amigável
const getDiaSemanaDisplay = (date: Date): string => {
  const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return diasSemana[date.getDay()];
};

const DiarioPage = () => {
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [carregandoTurmas, setCarregandoTurmas] = useState(false);

  // Buscar turmas quando a data muda
  useEffect(() => {
    const buscarTurmasDoDia = async () => {
      if (!dataSelecionada) return;

      setCarregandoTurmas(true);
      try {
        const diaSemana = getDiaSemanaFromDate(dataSelecionada);
        console.log('Buscando turmas para:', diaSemana);

        const { data, error } = await supabase
          .from('turmas')
          .select('*, professor:professores(id, nome)')
          .eq('dia_semana', diaSemana)
          .eq('active', true)
          .order('horario_inicio', { ascending: true });

        if (error) {
          console.error('Erro ao buscar turmas:', error);
          setTurmas([]);
          return;
        }

        console.log('Turmas encontradas:', data?.length || 0);
        setTurmas(data || []);
      } catch (error) {
        console.error('Erro ao buscar turmas:', error);
        setTurmas([]);
      } finally {
        setCarregandoTurmas(false);
      }
    };

    buscarTurmasDoDia();
  }, [dataSelecionada]);

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-laranja-DEFAULT">Diário de Turma</h1>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Coluna do Calendário */}
        <div className="lg:w-80 flex-shrink-0">
          <Card className="p-4 border-laranja-DEFAULT/30">
            <h3 className="text-lg font-medium mb-3 text-laranja-DEFAULT">Selecione o Dia</h3>
            <Calendar
              mode="single"
              selected={dataSelecionada}
              onSelect={(date) => date && setDataSelecionada(date)}
              className="rounded-md border pointer-events-auto"
              locale={ptBR}
            />
            
            <div className="mt-4 p-3 bg-muted/30 rounded-md">
              <p className="text-sm text-muted-foreground">Data selecionada:</p>
              <p className="font-medium text-laranja-DEFAULT">
                {format(dataSelecionada, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {getDiaSemanaDisplay(dataSelecionada)}
              </p>
            </div>
          </Card>
        </div>

        {/* Coluna das Turmas */}
        <div className="flex-1">
          <Card className="p-4 border-laranja-DEFAULT/30">
            <h3 className="text-lg font-medium mb-4 text-laranja-DEFAULT">
              Turmas de {getDiaSemanaDisplay(dataSelecionada)}
            </h3>
            
            <DiarioTurmaAccordion
              turmas={turmas}
              dataSelecionada={dataSelecionada}
              carregandoTurmas={carregandoTurmas}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DiarioPage;
