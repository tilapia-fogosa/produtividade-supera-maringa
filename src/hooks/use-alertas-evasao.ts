
import { useState, useEffect } from 'react';
import { useAlunos } from "@/hooks/use-alunos";
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useResponsaveis, Responsavel } from '@/hooks/use-responsaveis';

type OrigemAlerta = 'conversa_indireta' | 'aviso_recepcao' | 'aviso_professor_coordenador' | 'aviso_whatsapp' | 'inadimplencia' | 'outro';

export const origensAlerta = [
  { value: 'conversa_indireta' as OrigemAlerta, label: 'Conversa Indireta (entre alunos)' },
  { value: 'aviso_recepcao' as OrigemAlerta, label: 'Avisou na Recepção' },
  { value: 'aviso_professor_coordenador' as OrigemAlerta, label: 'Avisou ao Professor / Coordenador' },
  { value: 'aviso_whatsapp' as OrigemAlerta, label: 'Avisou no Whatsapp' },
  { value: 'inadimplencia' as OrigemAlerta, label: 'Inadimplência (2 Meses ou Mais)' },
  { value: 'outro' as OrigemAlerta, label: 'Outro' }
];

export function useAlertasEvasao() {
  const { todosAlunos } = useAlunos();
  const { responsaveis, isLoading: carregandoResponsaveis } = useResponsaveis();
  const [filtroAluno, setFiltroAluno] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState<string | null>(null);
  const [dataAlerta, setDataAlerta] = useState('');
  const [origemAlerta, setOrigemAlerta] = useState<OrigemAlerta | null>(null);
  const [descritivo, setDescritivo] = useState('');
  const [responsavelId, setResponsavelId] = useState<string | null>(null);
  const [responsavelNome, setResponsavelNome] = useState('');
  const [dataRetencao, setDataRetencao] = useState('');
  const [historicoAlertas, setHistoricoAlertas] = useState<string | null>(null);
  const [alertasAnteriores, setAlertasAnteriores] = useState<any[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [dadosAulaZero, setDadosAulaZero] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const alunosFiltrados = todosAlunos.filter(aluno => 
    aluno.nome.toLowerCase().includes(filtroAluno.toLowerCase())
  );

  // Atualiza o nome do responsável quando o ID é selecionado
  useEffect(() => {
    if (responsavelId) {
      const responsavelSelecionado = responsaveis.find(r => r.id === responsavelId);
      if (responsavelSelecionado) {
        setResponsavelNome(responsavelSelecionado.nome);
      }
    } else {
      setResponsavelNome('');
    }
  }, [responsavelId, responsaveis]);

  // Buscar alertas anteriores e dados da aula zero quando o aluno é selecionado
  useEffect(() => {
    const buscarDadosAluno = async () => {
      if (!alunoSelecionado) {
        setAlertasAnteriores([]);
        setHistoricoAlertas(null);
        setDadosAulaZero(null);
        return;
      }

      setCarregandoHistorico(true);
      try {
        // Buscar alertas anteriores
        const { data: alertasData, error: alertasError } = await supabase
          .from('alerta_evasao')
          .select('*')
          .eq('aluno_id', alunoSelecionado)
          .order('data_alerta', { ascending: false });

        if (alertasError) throw alertasError;

        // Buscar dados da aula zero do aluno
        const { data: alunoData, error: alunoError } = await supabase
          .from('alunos')
          .select('motivo_procura, percepcao_coordenador, avaliacao_abaco, avaliacao_ah, pontos_atencao')
          .eq('id', alunoSelecionado)
          .single();

        if (alunoError) throw alunoError;

        // Processar alertas anteriores
        if (alertasData && alertasData.length > 0) {
          setAlertasAnteriores(alertasData);
          
          // Construir texto de histórico
          const textoHistorico = alertasData.map(alerta => {
            const data = new Date(alerta.data_alerta).toLocaleDateString();
            return `${data} - ${alerta.origem_alerta}: ${alerta.descritivo || 'Sem descrição'}`;
          }).join('\n\n');
          
          setHistoricoAlertas(textoHistorico);
        }

        // Salvar dados da aula zero
        setDadosAulaZero(alunoData);

      } catch (error) {
        console.error('Erro ao buscar dados do aluno:', error);
      } finally {
        setCarregandoHistorico(false);
      }
    };

    buscarDadosAluno();
  }, [alunoSelecionado]);

  const construirHistoricoCompleto = () => {
    let historicoTexto = historicoAlertas || '';
    
    // Adicionar dados da aula zero se existirem
    if (dadosAulaZero) {
      let aulaZeroTexto = '\n\n=== DADOS DA AULA ZERO ===\n';
      
      if (dadosAulaZero.motivo_procura) {
        aulaZeroTexto += `\nMotivo da procura: ${dadosAulaZero.motivo_procura}`;
      }
      
      if (dadosAulaZero.percepcao_coordenador) {
        aulaZeroTexto += `\nPercepção do coordenador: ${dadosAulaZero.percepcao_coordenador}`;
      }
      
      if (dadosAulaZero.avaliacao_abaco) {
        aulaZeroTexto += `\nAvaliação no Ábaco: ${dadosAulaZero.avaliacao_abaco}`;
      }
      
      if (dadosAulaZero.avaliacao_ah) {
        aulaZeroTexto += `\nAvaliação no AH: ${dadosAulaZero.avaliacao_ah}`;
      }
      
      if (dadosAulaZero.pontos_atencao) {
        aulaZeroTexto += `\nPontos de atenção: ${dadosAulaZero.pontos_atencao}`;
      }
      
      // Só adicionar a seção se algum dos campos tiver dados
      if (aulaZeroTexto !== '\n\n=== DADOS DA AULA ZERO ===\n') {
        historicoTexto += aulaZeroTexto;
      }
    }
    
    return historicoTexto;
  };

  const resetForm = () => {
    setAlunoSelecionado(null);
    setDataAlerta('');
    setOrigemAlerta(null);
    setDescritivo('');
    setResponsavelId(null);
    setResponsavelNome('');
    setDataRetencao('');
    setFiltroAluno('');
    setHistoricoAlertas(null);
    setAlertasAnteriores([]);
    setDadosAulaZero(null);
  };

  const handleSubmit = async (onClose: () => void) => {
    if (!alunoSelecionado || !origemAlerta || !dataAlerta) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // TEMPORARIAMENTE DESABILITADO - Criação no banco de dados
      /*
      // Determinar a coluna inicial com base na presença de data de retenção
      const initialColumn = dataRetencao ? 'scheduled' : 'todo';
      
      // Construir o histórico completo com dados da aula zero se disponíveis
      const historicoCompleto = construirHistoricoCompleto();
      
      // Formatar a data do alerta para ser apenas a data, sem hora
      const dataAlertaFormatada = dataAlerta ? new Date(dataAlerta).toISOString().split('T')[0] : null;
      
      // Formatar a data de retenção, se existir
      const dataRetencaoFormatada = dataRetencao ? new Date(dataRetencao).toISOString() : null;
      
      // Primeiro salvar no banco de dados
      const { data: alertaData, error } = await supabase
        .from('alerta_evasao')
        .insert({
          aluno_id: alunoSelecionado,
          data_alerta: dataAlertaFormatada,
          origem_alerta: origemAlerta,
          descritivo,
          responsavel: responsavelNome,
          data_retencao: dataRetencaoFormatada,
          kanban_status: initialColumn, // Define a coluna inicial
        })
        .select();

      if (error) {
        console.error("Erro ao salvar alerta:", error);
        throw error;
      }
      */

      // Encontrar os dados do aluno selecionado
      const aluno = todosAlunos.find(a => a.id === alunoSelecionado);

      // Buscar dados da turma e professor para enviar ao Slack
      let turmaNome = 'Não informada';
      let professorNome = 'Não informado';
      let professorSlack = null;
      
      if (aluno?.turma_id) {
        const { data: turmaData, error: turmaError } = await supabase
          .from('turmas')
          .select('nome, professor_id, professor:professores(nome, slack_username)')
          .eq('id', aluno.turma_id)
          .single();
          
        if (!turmaError && turmaData) {
          turmaNome = turmaData.nome || 'Não informada';
          professorNome = turmaData.professor?.nome || 'Não informado';
          professorSlack = turmaData.professor?.slack_username || null;
        } else {
          console.warn('Não foi possível obter dados da turma:', turmaError);
        }
      }

      // TEMPORARIAMENTE DESABILITADO - Webhook de retenção agendada
      /*
      // Se temos uma data de retenção, enviar para o webhook de agendamento
      if (dataRetencao && alertaData && alertaData.length > 0) {
        const alertaId = alertaData[0].id;
        
        // Buscar o card criado pelo trigger
        const { data: cardData, error: cardError } = await supabase
          .from('kanban_cards')
          .select('*')
          .eq('alerta_evasao_id', alertaId)
          .single();
        
        if (cardError) {
          console.error('Erro ao buscar card criado:', cardError);
        } else if (cardData) {
          // Atualizamos o histórico do card para incluir dados da aula zero
          const { error: updateError } = await supabase
            .from('kanban_cards')
            .update({ 
              historico: historicoCompleto
            })
            .eq('id', cardData.id);
            
          if (updateError) {
            console.error('Erro ao atualizar histórico do card:', updateError);
          }
          
          // Enviar para o webhook de retenção agendada
          try {
            const webhookUrl = 'https://hook.us1.make.com/0t4vimtrmnqu3wtpfskf7ooydbjsh300';
            await fetch(webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                cardId: cardData.id,
                aluno: aluno?.nome,
                descricao: descritivo,
                dataRetencao: dataRetencao ? new Date(dataRetencao).toISOString() : null,
                responsavel: responsavelNome
              })
            });
          } catch (webhookError) {
            console.error('Erro ao enviar para webhook de retenção:', webhookError);
          }
        }
      }
      */

      // Enviar mensagem para o Slack
      try {
        console.log('Enviando alerta para o Slack...');
        const { data: slackResponse, error: slackError } = await supabase.functions.invoke(
          'enviarMensagemSlack', 
          {
            body: { 
              aluno: aluno?.nome || 'Aluno de Teste',
              alunoId: alunoSelecionado, // Enviamos o ID do aluno
              dataAlerta: new Date(dataAlerta).toLocaleDateString('pt-BR'),
              responsavel: responsavelNome,
              descritivo: descritivo,
              origem: origemAlerta,
              dataRetencao: dataRetencao ? new Date(dataRetencao).toLocaleDateString('pt-BR') : '',
              turma: turmaNome,
              professor: professorNome,
              professorSlack: professorSlack,
              username: 'Sistema Kadin'
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

      // Construir o histórico completo com dados da aula zero se disponíveis
      const historicoCompleto = construirHistoricoCompleto();
      
      // Formatar a data do alerta para ser apenas a data, sem hora
      const dataAlertaFormatada = dataAlerta ? new Date(dataAlerta).toISOString().split('T')[0] : null;
      
      // Formatar a data de retenção, se existir
      const dataRetencaoFormatada = dataRetencao ? new Date(dataRetencao).toISOString() : null;

      // Sempre envia para o webhook geral de alertas
      const webhookUrl = 'https://hook.us1.make.com/v8b7u98lehutsqqk9tox27b2bn7x1mmx';
      
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aluno: {
              id: alunoSelecionado,
              nome: aluno?.nome,
              codigo: aluno?.codigo,
              email: aluno?.email,
              telefone: aluno?.telefone
            },
            alerta: {
              data: dataAlertaFormatada,
              origem: origemAlerta,
              descritivo,
              responsavel: responsavelNome,
              data_retencao: dataRetencaoFormatada,
              historico: historicoCompleto
            }
          })
        });

        if (!webhookResponse.ok) {
          console.error('Erro ao enviar para webhook:', await webhookResponse.text());
        }
      } catch (webhookError) {
        console.error('Erro ao enviar para webhook:', webhookError);
      }

      toast({
        title: "Sucesso",
        description: "Alerta de evasão enviado para Slack e webhook com sucesso! (Banco temporariamente desabilitado)",
      });
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Erro ao processar alerta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar o alerta de evasão.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    filtroAluno,
    setFiltroAluno,
    alunoSelecionado,
    setAlunoSelecionado,
    dataAlerta,
    setDataAlerta,
    origemAlerta,
    setOrigemAlerta,
    descritivo,
    setDescritivo,
    responsavelId,
    setResponsavelId,
    responsavelNome,
    dataRetencao,
    setDataRetencao,
    alertasAnteriores,
    carregandoHistorico,
    historicoAlertas,
    dadosAulaZero,
    alunosFiltrados,
    isSubmitting,
    responsaveis,
    carregandoResponsaveis,
    handleSubmit,
    resetForm
  };
}
