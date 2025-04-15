
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const GoogleSheetsSync = () => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSync = async () => {
    try {
      setIsLoading(true);
      console.log('Iniciando sincronização...');
      
      const response = await supabase.functions.invoke('sync-students', {
        body: { 
          googleApiKey: "AIzaSyDD_yZKdX5TRttuS3yVifj2LgIpMmPn_z4",
          spreadsheetId: "1d7s_6NzfNL3Y4G5LUOsVHDfuQIGCizkELjw8iKQb1OY"
        }
      });

      console.log('Resposta:', response);

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Sincronização concluída",
        description: "Dados atualizados com sucesso.",
      });
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast({
        title: "Erro na sincronização",
        description: error.message || "Não foi possível sincronizar com o Google Sheets.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isLoading}
      size="sm"
      className="flex items-center bg-vivid-purple hover:bg-secondary-purple text-white"
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      {isLoading ? 'Sincronizando...' : 'Sincronizar'}
    </Button>
  );
};

export default GoogleSheetsSync;
