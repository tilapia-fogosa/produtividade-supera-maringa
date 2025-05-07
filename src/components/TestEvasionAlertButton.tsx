
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SendIcon, LoaderCircle } from 'lucide-react';

interface TestEvasionAlertButtonProps {
  alunoId?: string;
}

const TestEvasionAlertButton = ({ alunoId }: TestEvasionAlertButtonProps) => {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleCreateEvasionAlert = async () => {
    try {
      setIsSending(true);

      // Criar um alerta de evasão de teste
      const { data: alertaData, error: alertaError } = await supabase
        .from('alerta_evasao')
        .insert({
          aluno_id: alunoId || '6f60e30a-0e1e-4a0c-9a45-1cd023ac196e', // ID de aluno padrão se não for fornecido
          descritivo: 'Este é um alerta de teste enviado para o Slack',
          origem_alerta: 'outro', // Alterado de 'teste' para 'outro', que é um valor válido do enum
          responsavel: 'Sistema de Teste'
        })
        .select('id')
        .single();

      if (alertaError) {
        throw new Error(`Erro ao criar alerta de evasão: ${alertaError.message}`);
      }

      // Chamar a função edge do Supabase
      const { data, error } = await supabase.functions.invoke('send-evasion-alert-slack', {
        body: { record: alertaData }
      });
      
      if (error) {
        throw new Error(`Erro ao enviar alerta: ${error.message}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido ao enviar alerta');
      }
      
      toast({
        title: "Sucesso",
        description: "Alerta de evasão enviado com sucesso para o Slack!",
      });
    } catch (error) {
      console.error('Erro ao testar alerta de evasão:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao enviar o alerta de evasão",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button 
      onClick={handleCreateEvasionAlert}
      variant="outline"
      className="bg-red-500 hover:bg-red-600 text-white border-none"
      disabled={isSending}
    >
      {isSending ? (
        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <SendIcon className="mr-2 h-4 w-4" />
      )}
      {isSending ? 'Enviando...' : 'Testar Alerta de Evasão no Slack'}
    </Button>
  );
};

export default TestEvasionAlertButton;
