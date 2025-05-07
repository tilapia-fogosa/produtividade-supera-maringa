
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from "../_shared/cors.ts";

const SLACK_CHANNEL_ID = "C05UB69SDU7"; // Canal fixo para alertas de evasão

serve(async (req) => {
  // Tratamento de CORS para requisições preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const slackToken = Deno.env.get('SLACK_BOT_TOKEN')!;

    if (!slackToken) {
      console.error('Token do Slack não configurado');
      return new Response(
        JSON.stringify({ success: false, error: 'Token do Slack não configurado.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Obtém dados do corpo da requisição
    const { record } = await req.json();
    
    if (!record || !record.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Dados do alerta não fornecidos.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Obter detalhes completos do alerta e do aluno
    const { data: alertaDetalhes, error: alertaError } = await supabase
      .from('alerta_evasao')
      .select(`
        id,
        descritivo,
        aluno_id,
        data_alerta,
        origem_alerta,
        data_retencao,
        responsavel,
        alunos:aluno_id (
          nome
        )
      `)
      .eq('id', record.id)
      .single();
    
    if (alertaError || !alertaDetalhes) {
      console.error('Erro ao buscar detalhes do alerta:', alertaError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao buscar detalhes do alerta: ' + (alertaError?.message || 'Alerta não encontrado')
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Formatar data para exibição
    const dataAlerta = new Date(alertaDetalhes.data_alerta).toLocaleDateString('pt-BR');
    const dataRetencao = alertaDetalhes.data_retencao 
      ? new Date(alertaDetalhes.data_retencao).toLocaleDateString('pt-BR')
      : '';

    // Montar texto da mensagem
    const mensagem = `:batedor::batedor: ALERTA: Farejei uma possível Evasão :batedor::batedor:
Aluno: ${alertaDetalhes.alunos.nome}
Data do Aviso: ${dataAlerta}
Responsável Alerta: ${alertaDetalhes.responsavel || 'Não especificado'}
Informações: ${alertaDetalhes.descritivo || 'Sem informações adicionais'}
Origem do Alerta: ${alertaDetalhes.origem_alerta}
*Retenção agendada? ${dataRetencao ? `Data: ${dataRetencao}` : 'Não agendada'}*
@Chris Kulza para acompanhamento.`;
    
    // Enviar para a API do Slack
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Authorization': `Bearer ${slackToken}`
      },
      body: JSON.stringify({
        channel: SLACK_CHANNEL_ID,
        text: mensagem
      })
    });
    
    const responseData = await response.json();
    
    if (!responseData.ok) {
      console.error(`Erro ao enviar mensagem para o Slack: ${responseData.error}`);
      return new Response(
        JSON.stringify({ success: false, error: responseData.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Atualizar o registro com o ID da mensagem do Slack se precisar rastrear
    // const { error: updateError } = await supabase
    //   .from('alerta_evasao')
    //   .update({ slack_mensagem_id: responseData.ts })
    //   .eq('id', record.id);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Mensagem de alerta enviada com sucesso para o Slack!" 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro ao processar o alerta de evasão:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
