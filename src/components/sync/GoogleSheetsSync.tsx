
import React from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { RefreshCw } from 'lucide-react';
import { testStudentSync } from './test-sync';

const GoogleSheetsSync = () => {
  const handleSync = async () => {
    try {
      await testStudentSync();
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast({
        title: "Erro na Sincronização",
        description: "Ocorreu um erro ao tentar sincronizar os dados",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      onClick={handleSync}
      variant="outline"
      className="text-azul-500 border-orange-200"
    >
      <RefreshCw className="mr-2 h-4 w-4" />
      Sincronizar Turmas
    </Button>
  );
};

export default GoogleSheetsSync;
