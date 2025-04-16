
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export async function testStudentSync() {
  try {
    console.log('Iniciando teste de sincronização manual...');
    
    const response = await supabase.functions.invoke('sync-students', {
      body: { 
        googleApiKey: "AIzaSyDXql17Sz5PR3ki08IT2QNzZk-nGrffyao",
        spreadsheetId: "1yNEJzz05TpB7polA_W3kAs7e93LAo85hWwfomM-Yz44"
      }
    });

    console.log('Resposta completa da sincronização:', response);

    if (response.error) {
      console.error('Erro na sincronização:', response.error);
      toast({
        title: "Erro na Sincronização",
        description: response.error.message,
        variant: "destructive"
      });
      return;
    }

    if (response.data && !response.data.success) {
      console.error('Falha na sincronização:', response.data.error);
      toast({
        title: "Falha na Sincronização",
        description: response.data.error,
        variant: "destructive"
      });
      return;
    }

    console.log('Sincronização concluída com sucesso');
    toast({
      title: "Sincronização Concluída",
      description: response.data?.message || "Dados sincronizados com sucesso"
    });

  } catch (error) {
    console.error('Erro inesperado na sincronização:', error);
    toast({
      title: "Erro Inesperado",
      description: "Não foi possível realizar a sincronização",
      variant: "destructive"
    });
  }
}
