
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
      toast({
        title: "Enviando...",
        description: "Criando alerta de teste e enviando para o Slack",
      });
      
      console.log('Iniciando criação de alerta de evasão de teste');
      
      // Criar um alerta de evasão de teste
      const { data: alertaData, error: alertaError } = await supabase
        .from('alerta_evasao')
        .insert({
          aluno_id: alunoId || 'f8cf9249-e247-41b2-a004-2d937c721f5e', // ID de aluno válido da base de dados
          descritivo: 'Este é um alerta de teste enviado para o Slack',
          origem_alerta: 'outro', // Valor válido do enum
          responsavel: 'Sistema de Teste'
        })
        .select('id')
        .single();

      if (alertaError) {
        console.error('Erro ao criar alerta:', alertaError);
        throw new Error(`Erro ao criar alerta de evasão: ${alertaError.message}`);
      }

      console.log('Alerta criado com sucesso:', alertaData);

      // Verificação adicional para garantir que o alerta foi processado
      // Esperar 3 segundos para dar tempo ao trigger
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verificar se o card foi criado no kanban (indicativo que o trigger rodou)
      const { data: kanbanCard, error: kanbanError } = await supabase
        .from('kanban_cards')
        .select('*')
        .eq('alerta_evasao_id', alertaData.id)
        .single();
        
      if (kanbanError) {
        console.warn('Não foi possível verificar se o card foi criado:', kanbanError);
      } else {
        console.log('Card do kanban criado:', kanbanCard);
      }

      // Buscar informações do aluno para enviar ao Slack
      const { data: alunoData, error: alunoError } = await supabase
        .from('alunos')
        .select('nome')
        .eq('id', alunoId || 'f8cf9249-e247-41b2-a004-2d937c721f5e')
        .single();

      if (alunoError) {
        console.warn('Não foi possível obter dados do aluno:', alunoError);
      }

      // Chamar a edge function para enviar mensagem ao Slack
      try {
        console.log('Enviando alerta para o Slack...');
        const { data: slackResponse, error: slackError } = await supabase.functions.invoke(
          'enviarMensagemSlack', 
          {
            body: { 
              aluno: alunoData?.nome || 'Aluno de Teste',
              dataAlerta: new Date().toLocaleDateString('pt-BR'),
              responsavel: 'Sistema de Teste',
              descritivo: 'Este é um alerta de teste enviado para o Slack',
              origem: 'outro',
              dataRetencao: ''
            }
          }
        );
        
        if (slackError) {
          console.error('Erro ao enviar para o Slack:', slackError);
        } else {
          console.log('Resposta do Slack:', slackResponse);
        }
      } catch (slackError) {
        console.error('Erro ao invocar function de Slack:', slackError);
      }

      toast({
        title: "Sucesso",
        description: "Alerta de evasão criado com sucesso e enviado ao Slack!",
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
      size="mobile"
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
