
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Turma } from '@/hooks/use-professor-turmas';
import { PessoaTurma } from '@/hooks/use-pessoas-turma';
import { Calendar } from "@/components/ui/calendar";
import DiarioTabela from './diario/DiarioTabela';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";

interface DiarioTurmaScreenProps {
  turma: Turma;
  alunos?: PessoaTurma[];
  onBack: () => void;
}

const DiarioTurmaScreen: React.FC<DiarioTurmaScreenProps> = ({
  turma,
  alunos = [],
  onBack
}) => {
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [registros, setRegistros] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (dataSelecionada) {
      buscarRegistrosDiario(dataSelecionada);
    }
  }, [dataSelecionada, turma.id]);

  const buscarRegistrosDiario = async (data: Date) => {
    try {
      setCarregando(true);
      
      const dataFormatada = data.toISOString().split('T')[0];
      
      // Buscar registros de produtividade para a data selecionada
      const { data: produtividadeData, error: produtividadeError } = await supabase
        .from('produtividade_abaco')
        .select('*')
        .eq('data_aula', dataFormatada);
      
      if (produtividadeError) throw produtividadeError;
      
      // Filtrar registros por alunos da turma
      const pessoasIds = alunos.map(pessoa => pessoa.id);
      
      const registrosFiltrados = produtividadeData.filter(registro => 
        pessoasIds.includes(registro.aluno_id)
      );
      
      // Adicionar informações da pessoa (aluno ou funcionário) aos registros
      const registrosComPessoa = registrosFiltrados.map(registro => {
        const pessoa = alunos.find(p => p.id === registro.aluno_id);
        return {
          ...registro,
          pessoa: pessoa || null,
          origem: pessoa?.origem || 'desconhecido'
        };
      });
      
      console.log(`Encontrados ${registrosComPessoa.length} registros para ${dataFormatada}`);
      setRegistros(registrosComPessoa);
      
    } catch (error) {
      console.error('Erro ao buscar registros do diário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os registros do diário para a data selecionada.",
        variant: "destructive"
      });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="mt-4 bg-white rounded-lg shadow p-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-shrink-0 w-full md:w-80">
          <h3 className="text-lg font-medium mb-4 text-azul-500">Calendário</h3>
          <div className="p-2 border rounded-md">
            <Calendar
              mode="single"
              selected={dataSelecionada}
              onSelect={(date) => date && setDataSelecionada(date)}
              className="border rounded-md"
            />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-medium mb-4 text-azul-500">
            Registros de {dataSelecionada.toLocaleDateString('pt-BR')}
          </h3>
          
          <DiarioTabela 
            registros={registros}
            carregando={carregando}
            onRefresh={() => buscarRegistrosDiario(dataSelecionada)}
            dataSelecionada={dataSelecionada}
            turma={turma}
          />
        </div>
      </div>
    </div>
  );
};

export default DiarioTurmaScreen;
