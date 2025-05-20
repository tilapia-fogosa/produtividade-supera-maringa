
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Lidar com requisições CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Obter o token do Slack a partir das variáveis de ambiente
    const slackToken = Deno.env.get('SLACK_BOT_TOKEN');

    if (!slackToken) {
      console.error('Token do Slack não encontrado nas variáveis de ambiente');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token do Slack não configurado nas variáveis de ambiente' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }

    // Obter dados da requisição
    const { 
      aluno = "Aluno de Teste", 
      dataAlerta = new Date().toLocaleDateString('pt-BR'), 
      responsavel = "Sistema de Teste", 
      descritivo = "Este é um alerta de teste", 
      origem = "outro",
      dataRetencao = "",
      canal = "C05UB69SDU7",
      username = "Sistema Kadin",
      turma = "Não informada",
      professor = "Não informado",
      professorSlack = null,
      cardId = ""
    } = await req.json();
    
    // Criar cliente Supabase para buscar informações adicionais
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.0.0");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Buscar o ID do Slack da coordenadora Chris Kulza
    let coordenadoraSlack = "chriskulza"; // ID correto da Chris Kulza
    
    // Link para o painel pedagógico
    const painelPedagogicoLink = "https://pedagogico.agenciakadin.com.br/painel-pedagogico";
    
    // Formatar a mensagem conforme o template
    let mensagem = `🚨🚨 *ALERTA: Farejei uma possível Evasão* 🚨🚨

*Aluno:* ${aluno}
*Turma:* ${turma}
*Professor:* ${professorSlack ? `<@${professorSlack}>` : professor}
*Data do Aviso:* ${dataAlerta}
*Responsável Alerta:* ${responsavel}
*Informações:* ${descritivo}
*Origem do Alerta:* ${origem}
*Retenção agendada? Data:* ${dataRetencao || "Não agendada"}`;

    // Mencionar a Chris Kulza para acompanhamento
    mensagem += `\n<@${coordenadoraSlack}> para acompanhamento.`;
    
    // Adicionar link para o painel pedagógico
    mensagem += `\n\n<${painelPedagogicoLink}|👉 Ver no Painel Pedagógico>`;

    console.log('Enviando mensagem para o Slack:', mensagem);

    // Enviando para a API do Slack
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${slackToken}`,
      },
      body: JSON.stringify({
        channel: canal,
        text: mensagem,
        username: username,
      }),
    });

    const data = await response.json();

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

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Mensagem enviada com sucesso para o Slack" 
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
