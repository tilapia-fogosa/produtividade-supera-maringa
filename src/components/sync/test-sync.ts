
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface SyncResponse {
  success: boolean;
  message?: string;
  error?: string;
  statistics?: {
    professores: number;
    turmas: number;
    novosAlunos: number;
    totalRegistrosProcessados: number;
  };
}

export async function testStudentSync(): Promise<SyncResponse> {
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
      return {
        success: false,
        error: response.error.message
      };
    }

    if (response.data && !response.data.success) {
      console.error('Falha na sincronização:', response.data.error);
      return {
        success: false,
        error: response.data.error
      };
    }

    console.log('Sincronização concluída com sucesso');
    return {
      success: true,
      message: response.data?.message || "Dados sincronizados com sucesso",
      statistics: response.data?.statistics
    };

  } catch (error) {
    console.error('Erro inesperado na sincronização:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível realizar a sincronização"
    };
  }
}
