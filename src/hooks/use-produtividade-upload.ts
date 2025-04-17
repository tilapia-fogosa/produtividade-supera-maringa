
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useProdutividadeUpload = () => {
  const uploadCsv = async (csvData: any[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('upload-produtividade', {
        body: { data: csvData }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: data.message,
      });

      return data;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro",
        description: "Não foi possível fazer o upload dos dados",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    uploadCsv
  };
};
