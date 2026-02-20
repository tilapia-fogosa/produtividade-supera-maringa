import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, BookOpen, TrendingUp, CalendarDays } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import GoogleSheetsSync from "@/components/sync/GoogleSheetsSync";

interface Professor {
  id: string;
  nome: string;
}

enum ServiceType {
  NONE = 'none',
  PRODUTIVIDADE = 'produtividade',
  ABRINDO_HORIZONTES = 'abrindo_horizontes',
  DIARIO_TURMA = 'diario_turma'
}

const Professores = () => {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.NONE);
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

  const handleProfessorClick = (professorId: string) => {
    navigate(`/turmas/${professorId}`, { state: { serviceType } });
  };

  const handleServiceSelection = (type: ServiceType) => {
    setServiceType(type);
  };

  const handleBackToServices = () => {
    setServiceType(ServiceType.NONE);
  };

  const handleDiarioTurmaClick = () => {
    navigate('/diario');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-4 px-4 text-center text-azul-500">
        <p>Carregando professores...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-4 md:py-8">
      <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'} items-center mb-6 gap-4`}>
        <h1 className="text-2xl font-bold text-azul-500">
          {serviceType === ServiceType.NONE ? "Serviços" : 
           serviceType === ServiceType.PRODUTIVIDADE ? "Lançar Produtividade de Sala" : 
           serviceType === ServiceType.ABRINDO_HORIZONTES ? "Lançar Abrindo Horizontes" :
           "Diário de Turma"}
        </h1>
        
        <div className="flex gap-2">
          <GoogleSheetsSync />
        </div>
      </div>

      <Card className="border-orange-200 bg-white">
        {serviceType === ServiceType.NONE ? (
          <>
            <CardHeader className={`${isMobile ? "px-4 py-4" : ""} border-b border-orange-100`}>
              <CardTitle className="text-azul-500">Selecione o tipo de serviço</CardTitle>
              <CardDescription className="text-azul-400">
                Escolha o tipo de serviço que deseja lançar
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col space-y-4 p-6">
              <Button 
                size="lg" 
                className="py-8 text-lg bg-supera hover:bg-supera-600"
                onClick={() => handleServiceSelection(ServiceType.PRODUTIVIDADE)}
              >
                <TrendingUp className="mr-2 h-6 w-6" />
                Lançar Produtividade de Sala
              </Button>
              <Button 
                size="lg" 
                className="py-8 text-lg border-orange-300 text-azul-500 hover:bg-orange-100"
                onClick={() => handleServiceSelection(ServiceType.ABRINDO_HORIZONTES)}
                variant="outline"
              >
                <BookOpen className="mr-2 h-6 w-6" />
                Lançar Abrindo Horizontes
              </Button>
              <Button 
                size="lg" 
                className="py-8 text-lg bg-azul-500 hover:bg-azul-600"
                onClick={handleDiarioTurmaClick}
              >
                <CalendarDays className="mr-2 h-6 w-6" />
                Diário de Turma
              </Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className={`${isMobile ? "px-4 py-4" : ""} border-b border-orange-100`}>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-azul-500">Lista de Professores</CardTitle>
                  <CardDescription className="text-azul-400">
                    Selecione um professor para gerenciar suas turmas e alunos
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToServices}
                  className="text-azul-400 hover:text-azul-500 hover:bg-orange-50"
                >
                  Voltar para Serviços
                </Button>
              </div>
            </CardHeader>
            <CardContent className={isMobile ? "px-2 py-2" : ""}>
              {professores.length === 0 ? (
                <div className="text-center py-4 text-azul-500">
                  <p>Não há professores cadastrados.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-orange-200">
                        <TableHead className="text-azul-400">Nome</TableHead>
                        <TableHead className="w-[100px] text-right text-azul-400">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {professores.map((professor) => (
                        <TableRow key={professor.id} className="border-orange-200">
                          <TableCell className="font-medium text-azul-500">{professor.nome}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleProfessorClick(professor.id)}
                              className="flex items-center border-orange-300 text-azul-500 hover:bg-orange-50"
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
          </>
        )}
      </Card>
    </div>
  );
};

export default Professores;
