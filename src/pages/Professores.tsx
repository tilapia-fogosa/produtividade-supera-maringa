import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, RefreshCw, TrendingUp, BookOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface Professor {
  id: string;
  nome: string;
}

enum ServiceType {
  NONE = 'none',
  PRODUTIVIDADE = 'produtividade',
  ABRINDO_HORIZONTES = 'abrindo_horizontes'
}

const Professores = () => {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingGoogleSheets, setSyncingGoogleSheets] = useState(false);
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

  const syncGoogleSheets = async () => {
    try {
      setSyncingGoogleSheets(true);
      
      const response = await supabase.functions.invoke('sync-students');
      
      if (response.error) {
        throw new Error(response.error.message || 'Erro desconhecido ao chamar a função.');
      }
      
      const result = response.data;
      
      if (result.success) {
        let message = result.message;
        
        if (result.warnings) {
          if (result.warnings.turmasNaoEncontradas?.length > 0) {
            const turmasNaoEncontradas = result.warnings.turmasNaoEncontradas.slice(0, 5);
            const countRestantes = result.warnings.turmasNaoEncontradas.length - 5;
            
            message += ` Turmas não encontradas: ${turmasNaoEncontradas.join(', ')}${countRestantes > 0 ? ` e mais ${countRestantes} outras` : ''}.`;
            
            if (result.warnings.turmasNaoEncontradas.length > 0) {
              toast({
                title: "Atenção - Turmas não encontradas",
                description: `Existem ${result.warnings.turmasNaoEncontradas.length} turmas na planilha que não foram encontradas no sistema. Certifique-se de que os nomes das turmas correspondem exatamente.`,
                variant: "default"
              });
            }
          }
          
          if (result.warnings.professoresNaoEncontrados?.length > 0) {
            const professoresNaoEncontrados = result.warnings.professoresNaoEncontrados.slice(0, 3);
            const countRestantes = result.warnings.professoresNaoEncontrados.length - 3;
            
            message += ` Professores não encontrados: ${professoresNaoEncontrados.join(', ')}${countRestantes > 0 ? ` e mais ${countRestantes} outros` : ''}.`;
          }
        }
        
        toast({
          title: "Sincronização concluída",
          description: message,
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

  const handleServiceSelection = (type: ServiceType) => {
    setServiceType(type);
  };

  const handleBackToServices = () => {
    setServiceType(ServiceType.NONE);
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
           "Lançar Abrindo Horizontes"}
        </h1>
        
        <div className="flex gap-2">
          {serviceType !== ServiceType.NONE && (
            <Button 
              onClick={syncGoogleSheets}
              disabled={syncingGoogleSheets}
              size="sm"
              className="flex items-center self-end bg-supera hover:bg-supera-600"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${syncingGoogleSheets ? 'animate-spin' : ''}`} />
              {syncingGoogleSheets ? 'Sincronizando...' : isMobile ? 'Sincronizar' : 'Sincronizar Planilha'}
            </Button>
          )}
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
