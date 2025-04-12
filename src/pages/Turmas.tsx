
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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

  const handleAcessarTurma = (turmaId: string) => {
    // Implementação futura: navegação para a página de detalhes da turma
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O acesso aos detalhes da turma será implementado em breve.",
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
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">{professor?.nome}</CardTitle>
        </CardHeader>
        <CardContent>
          {turmas.length === 0 ? (
            <div className="text-center py-4">
              <p>Não há turmas cadastradas para este(a) professor(a).</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {turmas.map((turma) => (
                <Button
                  key={turma.id}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => handleAcessarTurma(turma.id)}
                >
                  <div>
                    <div className="font-medium">{turma.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {diasSemanaFormatados[turma.dia_semana]} às {formatarHorario(turma.horario)}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Turmas;
