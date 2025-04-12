
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Professor {
  id: string;
  nome: string;
}

interface Turma {
  id: string;
  nome: string;
  dia_semana: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo';
  horario: string;
}

interface Aluno {
  id: string;
  nome: string;
  turma_id: string;
}

const diasSemanaFormatados: Record<string, string> = {
  'segunda': 'Segunda-feira',
  'terca': 'Terça-feira',
  'quarta': 'Quarta-feira',
  'quinta': 'Quinta-feira',
  'sexta': 'Sexta-feira',
  'sabado': 'Sábado',
  'domingo': 'Domingo'
};

const formatarHorario = (horario: string) => {
  return horario.substring(0, 5); // Retorna apenas HH:MM
};

const Turmas = () => {
  const { professorId } = useParams<{ professorId: string }>();
  const navigate = useNavigate();
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Record<string, Aluno[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfessorETurmas = async () => {
      try {
        setLoading(true);
        
        // Buscar informações do professor
        const { data: professorData, error: professorError } = await supabase
          .from('professores')
          .select('id, nome')
          .eq('id', professorId)
          .single();

        if (professorError) {
          throw professorError;
        }

        setProfessor(professorData);

        // Buscar turmas do professor
        const { data: turmasData, error: turmasError } = await supabase
          .from('turmas')
          .select('*')
          .eq('professor_id', professorId)
          .order('dia_semana, horario');

        if (turmasError) {
          throw turmasError;
        }

        setTurmas(turmasData || []);

        // Se tiver turmas, buscar alunos para cada turma
        if (turmasData && turmasData.length > 0) {
          const alunosPorTurma: Record<string, Aluno[]> = {};
          
          // Buscar alunos para cada turma
          for (const turma of turmasData) {
            const { data: alunosData, error: alunosError } = await supabase
              .from('alunos')
              .select('*')
              .eq('turma_id', turma.id)
              .order('nome');

            if (alunosError) {
              console.error('Erro ao buscar alunos:', alunosError);
              continue;
            }

            alunosPorTurma[turma.id] = alunosData || [];
          }

          setAlunos(alunosPorTurma);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do professor e turmas.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (professorId) {
      fetchProfessorETurmas();
    }
  }, [professorId]);

  const handleVoltar = () => {
    navigate('/');
  };

  const handleRegistrarPresenca = (turmaId: string) => {
    // Implementação futura: navegação para a página de registro de presença
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O registro de presença será implementado em breve.",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button 
        onClick={handleVoltar} 
        variant="outline" 
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Turmas do(a) Professor(a) {professor?.nome}</CardTitle>
        </CardHeader>
        <CardContent>
          {turmas.length === 0 ? (
            <div className="text-center py-4">
              <p>Não há turmas cadastradas para este(a) professor(a).</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {turmas.map((turma) => (
                <Card key={turma.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>Turma: {turma.nome}</span>
                      <Button onClick={() => handleRegistrarPresenca(turma.id)}>
                        <ClipboardCheck className="mr-2 h-4 w-4" /> 
                        Registrar Presença
                      </Button>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {diasSemanaFormatados[turma.dia_semana]} às {formatarHorario(turma.horario)}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-lg font-semibold mb-2">Alunos</h3>
                    {alunos[turma.id]?.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {alunos[turma.id].map((aluno) => (
                            <TableRow key={aluno.id}>
                              <TableCell>{aluno.nome}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p>Não há alunos cadastrados nesta turma.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Turmas;
