
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Database, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { seedChristianeStudents } from "@/utils/seedDatabase";

interface Professor {
  id: string;
  nome: string;
}

const Professores = () => {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingGoogleSheets, setSyncingGoogleSheets] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfessores();
  }, []);

  const fetchProfessores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('professores')
        .select('id, nome')
        .order('nome');
        
      if (error) {
        throw error;
      }
      
      setProfessores(data || []);
    } catch (error) {
      console.error('Erro ao buscar professores:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de professores.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    const success = await seedChristianeStudents();
    
    if (success) {
      toast({
        title: "Sucesso",
        description: "Dados de exemplo da Christiane inseridos com sucesso!",
      });
    } else {
      toast({
        title: "Erro",
        description: "Erro ao inserir dados de exemplo.",
        variant: "destructive"
      });
    }
  };

  const handleProfessorClick = (professorId: string) => {
    navigate(`/turmas/${professorId}`);
  };

  const syncGoogleSheets = async () => {
    try {
      setSyncingGoogleSheets(true);
      
      const response = await supabase.functions.invoke('sync-students');
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      const result = response.data;
      
      if (result.success) {
        toast({
          title: "Sincronização concluída",
          description: result.message,
        });
      } else {
        throw new Error(result.error || 'Erro desconhecido na sincronização');
      }
    } catch (error) {
      console.error('Erro ao sincronizar com Google Sheets:', error);
      toast({
        title: "Erro na sincronização",
        description: error.message || "Não foi possível sincronizar com o Google Sheets.",
        variant: "destructive"
      });
    } finally {
      setSyncingGoogleSheets(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Carregando professores...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Professores</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleSeedData}
            className="flex items-center"
          >
            <Database className="mr-2 h-4 w-4" />
            Inserir Dados de Exemplo
          </Button>
          
          <Button 
            onClick={syncGoogleSheets}
            disabled={syncingGoogleSheets}
            className="flex items-center"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncingGoogleSheets ? 'animate-spin' : ''}`} />
            {syncingGoogleSheets ? 'Sincronizando...' : 'Sincronizar com Google Sheets'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Professores</CardTitle>
          <CardDescription>
            Selecione um professor para gerenciar suas turmas e alunos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {professores.length === 0 ? (
            <div className="text-center py-4">
              <p>Não há professores cadastrados.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {professores.map((professor) => (
                  <TableRow key={professor.id}>
                    <TableCell className="font-medium">{professor.nome}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleProfessorClick(professor.id)}
                        className="flex items-center"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Turmas
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Professores;
