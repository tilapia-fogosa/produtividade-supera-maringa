import React, { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import DiarioTabela from '@/components/turmas/turma-detail/diario/DiarioTabela';
import { Turma } from '@/hooks/use-professor-turmas';

// Tipo estendido para incluir horários
interface TurmaComHorario extends Turma {
  horario_inicio?: string;
  horario_fim?: string;
}

interface PessoaSimples {
  id: string;
  nome: string;
  foto_url?: string | null;
  origem: 'aluno' | 'funcionario';
}

interface DiarioTurmaAccordionProps {
  turmas: TurmaComHorario[];
  dataSelecionada: Date;
  carregandoTurmas: boolean;
}

interface TurmaComRegistros extends TurmaComHorario {
  registros: any[];
  pessoasTurma: PessoaSimples[];
  carregando: boolean;
  totalRegistros: number;
}

const DiarioTurmaAccordion: React.FC<DiarioTurmaAccordionProps> = ({
  turmas,
  dataSelecionada,
  carregandoTurmas
}) => {
  const [turmasExpandidas, setTurmasExpandidas] = useState<string[]>([]);
  const [turmasComDados, setTurmasComDados] = useState<Map<string, TurmaComRegistros>>(new Map());

  // Buscar pessoas e registros quando uma turma é expandida
  const buscarDadosTurma = async (turmaId: string) => {
    const turma = turmas.find(t => t.id === turmaId);
    if (!turma) return;

    // Marcar como carregando
    setTurmasComDados(prev => {
      const newMap = new Map(prev);
      newMap.set(turmaId, {
        ...turma,
        registros: [],
        pessoasTurma: [],
        carregando: true,
        totalRegistros: 0
      });
      return newMap;
    });

    try {
      const dataFormatada = dataSelecionada.toISOString().split('T')[0];

      // Buscar alunos da turma
      const { data: alunosData, error: alunosError } = await supabase
        .from('alunos')
        .select('id, nome, foto_url')
        .eq('turma_id', turmaId)
        .eq('active', true);

      if (alunosError) throw alunosError;

      // Buscar funcionários da turma
      const { data: funcionariosData, error: funcionariosError } = await supabase
        .from('funcionarios')
        .select('id, nome, foto_url')
        .eq('turma_id', turmaId)
        .eq('active', true);

      if (funcionariosError) throw funcionariosError;

      // Combinar pessoas
      const pessoasTurma: PessoaSimples[] = [
        ...(alunosData || []).map(a => ({ id: a.id, nome: a.nome, foto_url: a.foto_url, origem: 'aluno' as const })),
        ...(funcionariosData || []).map(f => ({ id: f.id, nome: f.nome, foto_url: f.foto_url, origem: 'funcionario' as const }))
      ];

      const pessoasIds = pessoasTurma.map(p => p.id);

      // Buscar registros de produtividade
      const { data: produtividadeData, error: produtividadeError } = await supabase
        .from('produtividade_abaco')
        .select('*')
        .eq('data_aula', dataFormatada)
        .in('pessoa_id', pessoasIds);

      if (produtividadeError) throw produtividadeError;

      // Adicionar informações da pessoa aos registros
      const registrosComPessoa = (produtividadeData || []).map(registro => {
        const pessoa = pessoasTurma.find(p => p.id === registro.pessoa_id);
        return {
          ...registro,
          pessoa: pessoa || null,
          origem: pessoa?.origem || 'desconhecido'
        };
      });

      setTurmasComDados(prev => {
        const newMap = new Map(prev);
        newMap.set(turmaId, {
          ...turma,
          registros: registrosComPessoa,
          pessoasTurma,
          carregando: false,
          totalRegistros: registrosComPessoa.length
        });
        return newMap;
      });

    } catch (error) {
      console.error('Erro ao buscar dados da turma:', error);
      setTurmasComDados(prev => {
        const newMap = new Map(prev);
        newMap.set(turmaId, {
          ...turma,
          registros: [],
          pessoasTurma: [],
          carregando: false,
          totalRegistros: 0
        });
        return newMap;
      });
    }
  };

  // Quando a data muda, limpar dados e recarregar turmas expandidas
  useEffect(() => {
    setTurmasComDados(new Map());
    turmasExpandidas.forEach(turmaId => {
      buscarDadosTurma(turmaId);
    });
  }, [dataSelecionada]);

  // Quando uma turma é expandida, buscar seus dados
  const handleAccordionChange = (value: string[]) => {
    const novasTurmasExpandidas = value.filter(id => !turmasExpandidas.includes(id));
    
    novasTurmasExpandidas.forEach(turmaId => {
      if (!turmasComDados.has(turmaId)) {
        buscarDadosTurma(turmaId);
      }
    });

    setTurmasExpandidas(value);
  };

  if (carregandoTurmas) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Carregando turmas...</p>
      </div>
    );
  }

  if (turmas.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md bg-muted/30">
        <p className="text-muted-foreground">Nenhuma turma encontrada para este dia.</p>
      </div>
    );
  }

  return (
    <Accordion 
      type="multiple" 
      value={turmasExpandidas}
      onValueChange={handleAccordionChange}
      className="space-y-2"
    >
      {turmas.map((turma) => {
        const dadosTurma = turmasComDados.get(turma.id);
        const totalRegistros = dadosTurma?.totalRegistros || 0;
        const carregando = dadosTurma?.carregando || false;

        return (
          <AccordionItem 
            key={turma.id} 
            value={turma.id}
            className="border rounded-lg bg-card px-4"
          >
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-3 text-left">
                <span className="font-medium">{turma.nome}</span>
                {(turma.horario_inicio && turma.horario_fim) && (
                  <Badge variant="outline" className="text-xs">
                    {turma.horario_inicio} - {turma.horario_fim}
                  </Badge>
                )}
                {turmasExpandidas.includes(turma.id) && (
                  <Badge 
                    variant={totalRegistros > 0 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {carregando ? "..." : `${totalRegistros} registro${totalRegistros !== 1 ? 's' : ''}`}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              {dadosTurma ? (
                <DiarioTabela
                  registros={dadosTurma.registros}
                  carregando={dadosTurma.carregando}
                  onRefresh={() => buscarDadosTurma(turma.id)}
                  dataSelecionada={dataSelecionada}
                  turma={turma}
                />
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Carregando...</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default DiarioTurmaAccordion;
