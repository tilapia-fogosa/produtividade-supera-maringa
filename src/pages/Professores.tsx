
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { toast } from "@/hooks/use-toast";
import { seedChristianeStudents } from '@/utils/seedDatabase';

interface Professor {
  id: string;
  nome: string;
}

const Professores = () => {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSeeded, setDataSeeded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfessores = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('professores')
        .select('id, nome')
        .order('nome');

      if (error) {
        console.error('Erro ao buscar professores:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de professores.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      setProfessores(data || []);
      setLoading(false);

      // Verificar se precisamos adicionar dados de teste
      if (!dataSeeded) {
        // Verificar se já temos alunos na turma da Christiane
        const { data: alunosData, error: alunosError } = await supabase
          .from('alunos')
          .select('count')
          .single();

        if (!alunosError && (!alunosData || alunosData.count === 0)) {
          // Não temos alunos, vamos inserir os dados de teste
          const success = await seedChristianeStudents();
          if (success) {
            setDataSeeded(true);
            // Não precisamos recarregar os professores, só os alunos foram adicionados
          }
        } else {
          // Já temos alunos ou ocorreu um erro, não inserimos novamente
          setDataSeeded(true);
        }
      }
    };

    fetchProfessores();
  }, [dataSeeded]);

  const handleProfessorSelect = (professorId: string) => {
    navigate(`/turmas/${professorId}`);
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
      <Card>
        <CardHeader>
          <CardTitle>Selecione um Professor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {professores.map((professor) => (
              <Button 
                key={professor.id} 
                onClick={() => handleProfessorSelect(professor.id)}
                className="w-full justify-start text-left"
              >
                {professor.nome}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Professores;
