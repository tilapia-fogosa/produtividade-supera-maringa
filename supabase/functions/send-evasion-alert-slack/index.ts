
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from "../_shared/cors.ts";

// Canal fixo para uso no Slack
const SLACK_CHANNEL_ID = "C06N9EWJXMG"; // Canal fixo para alertas de evasão

// Token fixo para uso no Slack - não depende mais da tabela dados_importantes
const SLACK_BOT_TOKEN = "xoxb-6800184675363-6778113409926-e24SGrSpPDqM42wEq2ngcsRh"; // Token hardcoded para Slack Bot

serve(async (req) => {
  // Tratamento de CORS para requisições preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log("Iniciando função send-evasion-alert-slack");
    
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log("Conectando ao Supabase URL:", supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Token agora é fixo, não precisamos mais buscar da tabela dados_importantes
    console.log("Usando token do Slack hardcoded:", SLACK_BOT_TOKEN.substring(0, 10) + "...");
    
    // IMPORTANTE: Canal agora é fixo
    console.log("Usando canal do Slack fixo:", SLACK_CHANNEL_ID);
    
    // Obtém dados do corpo da requisição
    console.log("Obtendo dados do corpo da requisição");
    let bodyData;
    try {
      bodyData = await req.json();
      console.log("Dados recebidos:", JSON.stringify(bodyData));
    } catch (parseError) {
      console.error("Erro ao analisar o corpo da requisição:", parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao analisar o corpo da requisição' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const { record } = bodyData;
    
    if (!record || !record.id) {
      console.error('Dados do alerta não fornecidos');
      return new Response(
        JSON.stringify({ success: false, error: 'Dados do alerta não fornecidos.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log("Record recebido:", JSON.stringify(record));

    // Obter detalhes completos do alerta e do aluno
    console.log("Buscando detalhes completos do alerta");
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
          nome,
          telefone,
          turma_id,
          email,
          ultimo_nivel,
          ultima_pagina,
          niveldesafio,
          motivo_procura,
          percepcao_coordenador
        )
      `)
      .eq('id', record.id)
      .single();
    
    if (alertaError || !alertaDetalhes) {
      console.error('Erro ao buscar detalhes do alerta:', alertaError?.message || 'Alerta não encontrado');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao buscar detalhes do alerta: ' + (alertaError?.message || 'Alerta não encontrado')
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log("Detalhes do alerta obtidos:", JSON.stringify(alertaDetalhes));

    // Agora buscamos os dados da turma separadamente
    const { data: turmaDados, error: turmaError } = alertaDetalhes.alunos?.turma_id ? await supabase
      .from('turmas')
      .select(`
        nome,
        professor_id
      `)
      .eq('id', alertaDetalhes.alunos.turma_id)
      .single() : { data: null, error: null };
    
    if (turmaError) {
      console.error('Erro ao buscar turma:', turmaError);
    }
    
    // Buscar dados do professor para menção no Slack
    console.log("Buscando dados do professor");
    let professorSlackUsername = null;
    if (turmaDados?.professor_id) {
      const { data: professorDados, error: professorError } = await supabase
        .from('professores')
        .select('nome, slack_username')
        .eq('id', turmaDados.professor_id)
        .single();
      
      if (professorError) {
        console.error('Erro ao buscar professor:', professorError);
      } else if (professorDados) {
        professorSlackUsername = professorDados.slack_username;
        console.log("Username do Slack do professor:", professorSlackUsername);
      }
    }

    // Buscar histórico de alertas anteriores do mesmo aluno
    console.log("Buscando histórico de alertas anteriores");
    const { data: alertasAnteriores, error: alertasError } = await supabase
      .from('alerta_evasao')
      .select(`
        id,
        descritivo,
        data_alerta,
        origem_alerta,
        data_retencao,
        responsavel
      `)
      .eq('aluno_id', alertaDetalhes.aluno_id)
      .neq('id', alertaDetalhes.id) // Excluir o alerta atual
      .order('data_alerta', { ascending: false })
      .limit(3); // Limitar para os 3 alertas mais recentes
    
    let historicoAlertas = '';
    if (alertasAnteriores && alertasAnteriores.length > 0) {
      historicoAlertas = '\n\n*Histórico de Alertas Anteriores:*\n';
      alertasAnteriores.forEach(alerta => {
        const dataFormatada = new Date(alerta.data_alerta).toLocaleDateString('pt-BR');
        historicoAlertas += `• ${dataFormatada} - ${alerta.origem_alerta}: ${alerta.descritivo || 'Sem descrição'}\n`;
      });
    }
    
    // Formatar data para exibição
    console.log("Formatando dados para a mensagem");
    const dataAlerta = new Date(alertaDetalhes.data_alerta).toLocaleDateString('pt-BR');
    const dataRetencao = alertaDetalhes.data_retencao 
      ? new Date(alertaDetalhes.data_retencao).toLocaleDateString('pt-BR')
      : '';

    // Informações do aluno e da turma
    const aluno = alertaDetalhes.alunos;
    const telefoneLimpo = aluno?.telefone ? aluno.telefone.replace(/[^\d]/g, '') : '';
    const linkWhatsapp = telefoneLimpo ? `https://wa.me/55${telefoneLimpo}` : '';
    
    // Informações da turma - apenas nome conforme solicitado
    let turmaInfo = 'Turma não encontrada';
    if (turmaDados) {
      turmaInfo = turmaDados.nome;
    }

    // Seção de informações do aluno
    let infoAluno = '';
    if (aluno) {
      infoAluno = `*Informações do Aluno:*
Email: ${aluno.email || 'N/A'}
Telefone: ${aluno.telefone || 'N/A'} ${linkWhatsapp ? `(<${linkWhatsapp}|Whatsapp>)` : ''}
Turma: ${turmaInfo}
Último Nível: ${aluno.ultimo_nivel || 'N/A'}
Última Página: ${aluno.ultima_pagina || 'N/A'}
Nível Desafio: ${aluno.niveldesafio || 'N/A'}`;
    }

    // Seção de informações da Aula Zero, se disponível
    let aulaZeroInfo = '';
    if (aluno && (aluno.motivo_procura || aluno.percepcao_coordenador)) {
      aulaZeroInfo = `\n\n*Dados da Aula Zero:*
${aluno.motivo_procura ? `Motivo da Procura: ${aluno.motivo_procura}` : ''}
${aluno.percepcao_coordenador ? `Percepção do Coordenador: ${aluno.percepcao_coordenador}` : ''}`;
    }

    // Preparar menções para o Slack
    console.log("Preparando menções para o Slack");
    const mencoes = ['<@chriskulza>'];
    if (professorSlackUsername) {
      mencoes.push(`<@${professorSlackUsername}>`);
    }
    const mencoesTxt = mencoes.join(' e ');

    // Montar texto da mensagem com o novo formato
    const mensagem = `🚨🚨 *ALERTA: Farejei uma possível Evasão* 🚨🚨
*Aluno:* ${alertaDetalhes.alunos?.nome}
*Data do Aviso:* ${dataAlerta}
*Responsável Alerta:* ${alertaDetalhes.responsavel || 'Não especificado'}
*Informações:* ${alertaDetalhes.descritivo || 'Sem informações adicionais'}
*Origem do Alerta:* ${alertaDetalhes.origem_alerta}
*Retenção agendada?* ${dataRetencao ? `Data: ${dataRetencao}` : 'Não agendada'}

${infoAluno}${aulaZeroInfo}${historicoAlertas}

${mencoesTxt} para acompanhamento.`;
    
    console.log("Mensagem preparada, enviando para o Slack");
    console.log("Mensagem completa:", mensagem);
    
    // Enviar para a API do Slack
    console.log("Chamando API do Slack com canal fixo:", SLACK_CHANNEL_ID);
    console.log("Token usado:", SLACK_BOT_TOKEN.substring(0, 5) + "...");
    
    // Teste de conexão com o Slack para debug
    console.log("Verificando se podemos alcançar a API do Slack...");
    try {
      const pingResponse = await fetch('https://slack.com/api/api.test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const pingData = await pingResponse.json();
      console.log("Resposta do teste da API do Slack:", JSON.stringify(pingData));
    } catch (pingError) {
      console.error("Erro ao testar API do Slack:", pingError);
    }
    
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`
      },
      body: JSON.stringify({
        channel: SLACK_CHANNEL_ID,
        text: mensagem
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro na resposta da API do Slack: Status ${response.status}`, errorText);
      return new Response(
        JSON.stringify({ success: false, error: `Erro na resposta do Slack: Status ${response.status} - ${errorText}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const responseData = await response.json();
    console.log("Resposta da API do Slack:", JSON.stringify(responseData));
    
    if (!responseData.ok) {
      console.error(`Erro ao enviar mensagem para o Slack: ${responseData.error}`);
      return new Response(
        JSON.stringify({ success: false, error: responseData.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    console.log("Mensagem enviada com sucesso para o Slack");
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Mensagem de alerta enviada com sucesso para o Slack!" 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro ao processar o alerta de evasão:', error.message);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
