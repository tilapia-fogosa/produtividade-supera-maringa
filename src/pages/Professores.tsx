
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

interface Professor {
  id: string;
  nome: string;
}

const Professores = () => {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfessores = async () => {
      const { data, error } = await supabase
        .from('professores')
        .select('id, nome')
        .order('nome');

      if (error) {
        console.error('Erro ao buscar professores:', error);
        return;
      }

      setProfessores(data || []);
    };

    fetchProfessores();
  }, []);

  const handleProfessorSelect = (professorId: string) => {
    navigate(`/turmas/${professorId}`);
  };

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
                className="w-full"
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
