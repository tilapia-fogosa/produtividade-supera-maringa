
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SendIcon, LoaderCircle } from 'lucide-react';
import { useActiveUnit } from '@/contexts/ActiveUnitContext';

interface TestEvasionAlertButtonProps {
  alunoId?: string;
}

const TestEvasionAlertButton = ({ alunoId }: TestEvasionAlertButtonProps) => {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { activeUnit } = useActiveUnit();

  const handleCreateEvasionAlert = async () => {
    try {
      setIsSending(true);
      toast({
        title: "Enviando...",
        description: "Criando alerta de teste e enviando para o Slack",
      });
      
      // ID de aluno padrão (apenas use se nenhum for fornecido)
      const aluno_id = alunoId || 'f8cf9249-e247-41b2-a004-2d937c721f5e';
      
      console.log('Iniciando criação de alerta de evasão de teste para aluno ID:', aluno_id);
      
      // Primeiro, buscar todos os dados necessários do aluno e sua turma
      const { data: alunoData, error: alunoError } = await supabase
        .from('alunos')
        .select(`
          nome, 
          turma_id,
          turmas(
            id,
            nome,
            dia_semana,
            professor_id,
            professores(
              nome,
              slack_username
            )
          )
        `)
        .eq('id', aluno_id)
        .single();

      if (alunoError) {
        console.error('Erro ao buscar dados do aluno:', alunoError);
        throw new Error(`Erro ao buscar dados do aluno: ${alunoError.message}`);
      }

      console.log('Dados do aluno obtidos:', alunoData);
      
      // Usar o nome da turma como está no banco (já inclui horário e outras informações)
      let turmaNome = 'Não informada';
      let professorNome = 'Não informado';
      let professorSlack = null;
      
      if (alunoData.turmas) {
        const turma = Array.isArray(alunoData.turmas) ? alunoData.turmas[0] : alunoData.turmas;
        
        // Usar o nome da turma diretamente (já contém as informações necessárias)
        turmaNome = turma.nome;
        
        // Dados do professor
        if (turma.professores) {
          professorNome = turma.professores.nome || 'Não informado';
          professorSlack = turma.professores.slack_username;
        }
        
        console.log('Dados formatados da turma:', { 
          turmaNome, 
          professorNome, 
          professorSlack 
        });
      }
      
      // Criar um alerta de evasão de teste
      const { data: alertaData, error: alertaError } = await supabase
        .from('alerta_evasao')
        .insert({
          aluno_id: aluno_id,
          descritivo: 'Este é um alerta de teste enviado para o Slack',
          origem_alerta: 'outro',
          responsavel: 'Sistema de Teste',
          unit_id: activeUnit?.id || '0df79a04-444e-46ee-b218-59e4b1835f4a'
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

      // Chamar a edge function para enviar mensagem ao Slack com os dados corretos
      try {
        console.log('Enviando alerta para o Slack...');
        const { data: slackResponse, error: slackError } = await supabase.functions.invoke(
          'enviarMensagemSlack', 
          {
            body: { 
              aluno: alunoData.nome || 'Aluno de Teste',
              alunoId: aluno_id, // Enviamos o ID do aluno para buscar dados dinâmicos
              dataAlerta: new Date().toLocaleDateString('pt-BR'),
              responsavel: 'Sistema de Teste',
              descritivo: 'Este é um alerta de teste enviado para o Slack',
              origem: 'outro',
              dataRetencao: '',
              turma: turmaNome,
              professor: professorNome,
              professorSlack: professorSlack,
              username: 'Sistema Kadin',
              cardId: kanbanCard?.id || ''
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
