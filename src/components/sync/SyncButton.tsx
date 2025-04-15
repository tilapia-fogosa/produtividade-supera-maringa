
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SyncButtonProps {
  className?: string;
}

const SyncButton: React.FC<SyncButtonProps> = ({ className }) => {
  const [syncing, setSyncing] = React.useState(false);
  const isMobile = useIsMobile();

  const handleSync = async () => {
    try {
      console.log('Iniciando sincronização com Google Sheets...');
      setSyncing(true);
      
      const response = await supabase.functions.invoke('sync-students', {
        body: { test: true }
      });
      
      console.log('Resposta da função:', response);
      
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
      console.error('Erro detalhado ao sincronizar:', error);
      toast({
        title: "Erro na sincronização",
        description: error.message || "Não foi possível sincronizar com o Google Sheets.",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button 
      onClick={handleSync}
      disabled={syncing}
      size="sm"
      className={`flex items-center bg-supera hover:bg-supera-600 ${className}`}
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? 'Sincronizando...' : isMobile ? 'Sincronizar' : 'Sincronizar Planilha'}
    </Button>
  );
};

export default SyncButton;
