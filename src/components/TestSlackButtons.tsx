
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { SendIcon, LoaderCircle } from 'lucide-react';

const TestSlackButtons = () => {
  const [isSendingFaltas, setIsSendingFaltas] = useState(false);
  const [isSendingEvasao, setIsSendingEvasao] = useState(false);
  const { toast } = useToast();

  const handleSendTestFaltas = async () => {
    try {
      setIsSendingFaltas(true);

      const { data, error } = await supabase.functions.invoke('test-slack-message');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido ao enviar mensagem de teste');
      }
      
      toast({
        title: "Sucesso",
        description: "Mensagem de teste enviada com sucesso para o canal de faltas!",
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem de teste para o canal de faltas:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao enviar a mensagem de teste",
        variant: "destructive"
      });
    } finally {
      setIsSendingFaltas(false);
    }
  };

  const handleSendTestEvasao = async () => {
    try {
      setIsSendingEvasao(true);

      // Criar um alerta de evasão de teste
      const { data: alertaData, error: alertaError } = await supabase
        .from('alerta_evasao')
        .insert({
          aluno_id: 'f8cf9249-e247-41b2-a004-2d937c721f5e', // ID de aluno válido da base de dados
          descritivo: 'Este é um alerta de teste enviado para o canal de evasão',
          origem_alerta: 'outro', // Valor válido do enum
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
        description: "Alerta de evasão enviado com sucesso para o canal de evasão!",
      });
    } catch (error) {
      console.error('Erro ao testar alerta de evasão:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao enviar o alerta de evasão",
        variant: "destructive"
      });
    } finally {
      setIsSendingEvasao(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-xl font-bold text-center mb-2">Teste de Integrações com Slack</h2>
      
      <Button 
        onClick={handleSendTestFaltas}
        size="mobile"
        variant="outline"
        className="bg-blue-500 hover:bg-blue-600 text-white border-none"
        disabled={isSendingFaltas}
      >
        {isSendingFaltas ? (
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <SendIcon className="mr-2 h-4 w-4" />
        )}
        {isSendingFaltas ? 'Enviando...' : 'Testar Envio para Canal de Faltas'}
      </Button>

      <Button 
        onClick={handleSendTestEvasao}
        size="mobile"
        variant="outline"
        className="bg-red-500 hover:bg-red-600 text-white border-none"
        disabled={isSendingEvasao}
      >
        {isSendingEvasao ? (
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <SendIcon className="mr-2 h-4 w-4" />
        )}
        {isSendingEvasao ? 'Enviando...' : 'Testar Envio para Canal de Evasão'}
      </Button>
    </div>
  );
};

export default TestSlackButtons;
