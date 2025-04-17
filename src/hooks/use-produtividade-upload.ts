
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useProdutividadeUpload = () => {
  const uploadCsv = async (csvData: any[]) => {
    try {
      console.log(`Enviando ${csvData.length} registros para o servidor`);
      
      // Verificar rapidamente se todos os registros possuem aluno_id
      const registrosSemAlunoId = csvData.filter(record => !record.aluno_id);
      if (registrosSemAlunoId.length > 0) {
        console.error('Registros sem aluno_id encontrados:', registrosSemAlunoId);
        throw new Error(`${registrosSemAlunoId.length} registros estão sem o campo aluno_id obrigatório`);
      }
      
      const { data, error } = await supabase.functions.invoke('upload-produtividade', {
        body: { data: csvData }
      });

      if (error) {
        console.error('Erro na invocação da função:', error);
        throw error;
      }

      console.log('Resposta do servidor:', data);

      toast({
        title: "Sucesso",
        description: data.message || "Upload realizado com sucesso",
      });

      return data;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      const mensagemErro = error instanceof Error 
        ? error.message 
        : "Não foi possível fazer o upload dos dados";
        
      toast({
        title: "Erro",
        description: mensagemErro,
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    uploadCsv
  };
};
