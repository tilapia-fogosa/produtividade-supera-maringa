
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Clock, Calendar, Info, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
  codigo?: string | null;
  telefone?: string | null;
  email?: string | null;
  curso?: string | null;
  matricula?: string | null;
  idade?: number | null;
  ultimo_nivel?: string | null;
  dias_apostila?: number | null;
  dias_supera?: number | null;
  vencimento_contrato?: string | null;
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
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [alunoDetalhes, setAlunoDetalhes] = useState<Aluno | null>(null);

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

  const handleTurmaSelecionada = async (turmaId: string) => {
    setTurmaSelecionada(turmaId);
    setAlunoDetalhes(null);
    
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('turma_id', turmaId)
        .order('nome');
        
      if (error) {
        throw error;
      }
      
      setAlunos(data || []);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de alunos.",
        variant: "destructive"
      });
    }
  };

  const handleRegistrarPresenca = (alunoId: string) => {
    // Implementação futura
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O registro de presença será implementado em breve.",
    });
  };

  const mostrarDetalhesAluno = (aluno: Aluno) => {
    setAlunoDetalhes(aluno);
  };

  const fecharDetalhesAluno = () => {
    setAlunoDetalhes(null);
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
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">{professor?.nome}</CardTitle>
          <CardDescription>
            {turmas.length} turma{turmas.length !== 1 ? 's' : ''} encontrada{turmas.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {turmas.length === 0 ? (
            <div className="text-center py-4">
              <p>Não há turmas cadastradas para este(a) professor(a).</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {!turmaSelecionada ? (
                // Lista de turmas
                <div className="grid gap-2">
                  {turmas.map((turma) => (
                    <Button
                      key={turma.id}
                      variant="outline"
                      className="w-full justify-between text-left h-auto py-3 px-4"
                      onClick={() => handleTurmaSelecionada(turma.id)}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{turma.nome}</span>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          <span>{diasSemanaFormatados[turma.dia_semana]}</span>
                          <Clock className="h-3.5 w-3.5 ml-3 mr-1" />
                          <span>{formatarHorario(turma.horario)}</span>
                        </div>
                      </div>
                      <ArrowLeft className="h-4 w-4 rotate-180" />
                    </Button>
                  ))}
                </div>
              ) : alunoDetalhes ? (
                // Detalhes do aluno
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fecharDetalhesAluno}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para lista
                    </Button>
                    <div className="text-lg font-medium truncate">
                      {alunoDetalhes.nome}
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Informações Pessoais</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt className="font-medium text-muted-foreground">Código:</dt>
                            <dd>{alunoDetalhes.codigo || 'Não informado'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="font-medium text-muted-foreground">Idade:</dt>
                            <dd>{alunoDetalhes.idade !== null ? alunoDetalhes.idade : 'Não informada'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="font-medium text-muted-foreground">Email:</dt>
                            <dd className="break-all">{alunoDetalhes.email || 'Não informado'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="font-medium text-muted-foreground">Telefone:</dt>
                            <dd>{alunoDetalhes.telefone || 'Não informado'}</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Informações Acadêmicas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt className="font-medium text-muted-foreground">Curso:</dt>
                            <dd>{alunoDetalhes.curso || 'Não informado'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="font-medium text-muted-foreground">Matrícula:</dt>
                            <dd>{alunoDetalhes.matricula || 'Não informada'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="font-medium text-muted-foreground">Último nível:</dt>
                            <dd>{alunoDetalhes.ultimo_nivel || 'Não informado'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="font-medium text-muted-foreground">Dias na apostila:</dt>
                            <dd>{alunoDetalhes.dias_apostila !== null ? alunoDetalhes.dias_apostila : 'Não informado'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="font-medium text-muted-foreground">Dias no Supera:</dt>
                            <dd>{alunoDetalhes.dias_supera !== null ? alunoDetalhes.dias_supera : 'Não informado'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="font-medium text-muted-foreground">Vencimento do contrato:</dt>
                            <dd>{alunoDetalhes.vencimento_contrato || 'Não informado'}</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                // Lista de alunos da turma selecionada
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setTurmaSelecionada(null)}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para turmas
                    </Button>
                    <div className="text-lg font-medium">
                      {turmas.find(t => t.id === turmaSelecionada)?.nome}
                    </div>
                  </div>

                  {alunos.length === 0 ? (
                    <div className="text-center py-4">
                      <p>Não há alunos cadastrados nesta turma.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome do Aluno</TableHead>
                          <TableHead className="hidden md:table-cell">Código</TableHead>
                          <TableHead className="hidden md:table-cell">Último Nível</TableHead>
                          <TableHead className="w-[120px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alunos.map((aluno, index) => (
                          <TableRow key={aluno.id} className={index % 2 === 1 ? "bg-muted/50" : ""}>
                            <TableCell className="font-medium">{aluno.nome}</TableCell>
                            <TableCell className="hidden md:table-cell">{aluno.codigo || '-'}</TableCell>
                            <TableCell className="hidden md:table-cell">{aluno.ultimo_nivel || '-'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => mostrarDetalhesAluno(aluno)}
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleRegistrarPresenca(aluno.id)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Turmas;
