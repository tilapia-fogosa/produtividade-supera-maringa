
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { LoaderCircle, RefreshCw } from 'lucide-react';
import { testStudentSync } from './test-sync';

const GoogleSheetsSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);

      const response = await testStudentSync();
      
      if (response.success) {
        toast({
          title: "Sincronização Concluída",
          description: `${response.statistics?.professores || 0} professores, ${response.statistics?.turmas || 0} turmas e ${response.statistics?.novosAlunos || 0} alunos sincronizados.`,
        });
      } else {
        throw new Error(response.error || 'Erro desconhecido na sincronização');
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast({
        title: "Erro na Sincronização",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao tentar sincronizar os dados",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button 
      onClick={handleSync}
      variant="outline"
      className="text-azul-500 border-orange-200"
      disabled={isSyncing}
    >
      {isSyncing ? (
        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="mr-2 h-4 w-4" />
      )}
      {isSyncing ? 'Sincronizando...' : 'Sincronizar Turmas'}
    </Button>
  );
};

export default GoogleSheetsSync;
