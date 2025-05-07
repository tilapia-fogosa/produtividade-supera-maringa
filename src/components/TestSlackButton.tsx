
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SendIcon, LoaderCircle } from 'lucide-react';

const TestSlackButton = () => {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendTestMessage = async () => {
    try {
      setIsSending(true);

      const { data, error } = await supabase.functions.invoke('test-slack-message');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido ao enviar mensagem de teste');
      }
      
      toast({
        title: "Sucesso",
        description: "Mensagem de teste enviada com sucesso para o Slack!",
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem de teste:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao enviar a mensagem de teste",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button 
      onClick={handleSendTestMessage}
      variant="outline"
      className="bg-blue-500 hover:bg-blue-600 text-white border-none"
      disabled={isSending}
    >
      {isSending ? (
        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <SendIcon className="mr-2 h-4 w-4" />
      )}
      {isSending ? 'Enviando...' : 'Enviar Mensagem Teste para o Slack'}
    </Button>
  );
};

export default TestSlackButton;
