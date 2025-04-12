
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface Professor {
  id: string;
  nome: string;
}

const Professores = () => {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingGoogleSheets, setSyncingGoogleSheets] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
      
      // Temporariamente alterando "Andre" para "Camila"
      const updatedData = data?.map(prof => {
        if (prof.nome === "Andre") {
          return { ...prof, nome: "Camila" };
        }
        return prof;
      }) || [];
      
      setProfessores(updatedData);
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

  const handleProfessorClick = (professorId: string) => {
    navigate(`/turmas/${professorId}`);
  };

  const syncGoogleSheets = async () => {
    try {
      setSyncingGoogleSheets(true);
      
      const response = await supabase.functions.invoke('sync-students');
      
      if (response.error) {
        throw new Error(response.error.message || 'Erro desconhecido ao chamar a função.');
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
        description: error.message || "Não foi possível sincronizar com o Google Sheets. Verifique se as credenciais estão corretas e se a planilha está acessível.",
        variant: "destructive"
      });
    } finally {
      setSyncingGoogleSheets(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-4 px-4 text-center">
        <p>Carregando professores...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-4 md:py-8">
      <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'} items-center mb-6 gap-4`}>
        <h1 className="text-2xl font-bold">Professores</h1>
        
        <Button 
          onClick={syncGoogleSheets}
          disabled={syncingGoogleSheets}
          size="sm"
          className="flex items-center self-end"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${syncingGoogleSheets ? 'animate-spin' : ''}`} />
          {syncingGoogleSheets ? 'Sincronizando...' : isMobile ? 'Sincronizar' : 'Sincronizar Planilha'}
        </Button>
      </div>

      <Card>
        <CardHeader className={isMobile ? "px-4 py-4" : ""}>
          <CardTitle>Lista de Professores</CardTitle>
          <CardDescription>
            Selecione um professor para gerenciar suas turmas e alunos
          </CardDescription>
        </CardHeader>
        <CardContent className={isMobile ? "px-2 py-2" : ""}>
          {professores.length === 0 ? (
            <div className="text-center py-4">
              <p>Não há professores cadastrados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {professores.map((professor) => (
                    <TableRow key={professor.id}>
                      <TableCell className="font-medium">{professor.nome}</TableCell>
                      <TableCell className="text-right">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Professores;
