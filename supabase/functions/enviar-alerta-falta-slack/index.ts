import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Token e canal hardcoded para alertas de falta
const SLACK_BOT_TOKEN = "xoxb-5990179335553-7417193096371-xICG9oDp0nFrscu3lyaxQxSF";
const SLACK_CHANNEL_ID = "C06850QHPD5"; // Canal específico para alertas de falta

serve(async (req) => {
  // Lidar com requisições CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log('=== INICIANDO ENVIO DE ALERTA DE FALTA PARA SLACK ===');
    
    // Obter dados da requisição
    const { 
      aluno_nome,
      professor_nome,
      professor_slack,
      turma_nome,
      dias_supera,
      data_falta,
      faltas_consecutivas,
      motivo_falta,
      tipo_criterio
    } = await req.json();
    
    console.log('Dados recebidos:', {
      aluno_nome,
      professor_nome,
      professor_slack,
      turma_nome,
      dias_supera,
      data_falta,
      faltas_consecutivas,
      motivo_falta,
      tipo_criterio
    });
    
    // Validar dados obrigatórios
    if (!aluno_nome || !professor_nome || !turma_nome || !data_falta) {
      console.error('Dados obrigatórios ausentes');
      return new Response(
        JSON.stringify({ success: false, error: 'Dados obrigatórios ausentes' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    // Formatar a data do alerta para o padrão brasileiro
    const formatarDataBrasileira = (dataString: string) => {
      try {
        // Se a data está no formato YYYY-MM-DD
        const [ano, mes, dia] = dataString.split('-');
        return `${dia}/${mes}/${ano}`;
      } catch (error) {
        console.error('Erro ao formatar data:', error);
        return dataString; // Retorna a data original se não conseguir formatar
      }
    };
    
    const dataFaltaFormatada = formatarDataBrasileira(data_falta);
    
    // Montar a mensagem conforme o template especificado
    let mensagem = `🚨 Alerta de Falta - Falta Recorrente 🚨
Professor: ${professor_nome}`;

    // Adicionar menção ao professor se tiver slack_username
    if (professor_slack) {
      mensagem += `\n<@${professor_slack}>`;
    }

    mensagem += `

Turma: ${turma_nome}
Aluno: ${aluno_nome}
Tempo de Supera: ${dias_supera || 'N/A'} dias
Data: ${dataFaltaFormatada}`;

    // Adicionar informação sobre faltas consecutivas baseado no critério
    if (tipo_criterio === 'faltas_consecutivas') {
      mensagem += `
ATENÇÃO: Este aluno já faltou (${faltas_consecutivas}) faltas em sequência.`;
    } else if (tipo_criterio === 'aluno_recente') {
      mensagem += `
ATENÇÃO: Aluno recente com menos de 90 dias na Supera que faltou.`;
    }

    // Adicionar motivo da falta se houver
    mensagem += `
Motivo da Falta: ${motivo_falta || 'Não informado'}`;

    // Adicionar menção hardcoded da chriskulza
    mensagem += `
<@chriskulza> para acompanhamento.`;

    console.log('Mensagem formatada:', mensagem);

    // Enviando para a API do Slack
    console.log('Enviando mensagem para o Slack...');
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify({
        channel: SLACK_CHANNEL_ID,
        text: mensagem,
        username: "Sistema de Alertas de Falta",
      }),
    });

    const data = await response.json();
    console.log('Resposta do Slack:', data);

    if (!data.ok) {
      console.error('Erro ao enviar mensagem para o Slack:', data.error);
      return new Response(
        JSON.stringify({ success: false, error: data.error }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log('✅ Mensagem enviada com sucesso para o Slack');
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Alerta de falta enviado com sucesso para o Slack",
        slack_message_id: data.ts
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});