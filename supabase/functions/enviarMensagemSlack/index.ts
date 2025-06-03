
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Token real do Slack Bot
const SLACK_BOT_TOKEN = "xoxb-5990179335553-7417193096371-xICG9oDp0nFrscu3lyaxQxSF";
const SLACK_CHANNEL_ID = "C05UB69SDU7"; // Canal padrão para mensagens

serve(async (req) => {
  // Lidar com requisições CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Obter dados da requisição
    const { 
      aluno = "Aluno de Teste", 
      dataAlerta = new Date().toISOString().split('T')[0], // Recebe no formato YYYY-MM-DD
      responsavel = "Sistema de Teste", 
      descritivo = "Este é um alerta de teste", 
      origem = "outro",
      dataRetencao = "",
      canal = SLACK_CHANNEL_ID, // Usa o canal hardcoded como padrão, mas permite sobrescrever
      username = "Sistema Kadin",
      turma = "",
      professor = "",
      professorSlack = null,
      cardId = "",
      alunoId = "" // Parâmetro para buscar dados dinâmicos
    } = await req.json();
    
    // Criar cliente Supabase para buscar informações adicionais
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.0.0");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Variáveis para armazenar dados do aluno, turma e professor
    let alunoNome = aluno;
    let turmaNome = turma;
    let professorNome = professor;
    let professorSlackUsername = professorSlack;
    
    // Se temos um ID de aluno, buscamos todos os dados relacionados
    if (alunoId) {
      console.log(`Buscando dados completos do aluno ID: ${alunoId}`);
      
      try {
        // Buscar dados do aluno
        const { data: alunoData, error: alunoError } = await supabase
          .from('alunos')
          .select('nome, turma_id')
          .eq('id', alunoId)
          .single();
          
        if (alunoError) {
          console.error('Erro ao buscar dados do aluno:', alunoError);
        } else if (alunoData) {
          console.log('Dados do aluno obtidos:', JSON.stringify(alunoData));
          
          // Atualiza o nome do aluno
          alunoNome = alunoData.nome || aluno;
          
          if (alunoData.turma_id) {
            // Buscar os dados da turma
            const { data: turmaData, error: turmaError } = await supabase
              .from('turmas')
              .select('nome, professor_id')
              .eq('id', alunoData.turma_id)
              .single();
              
            if (turmaError) {
              console.error('Erro ao buscar dados da turma:', turmaError);
            } else if (turmaData) {
              console.log('Dados da turma obtidos:', JSON.stringify(turmaData));
              
              // Usar diretamente o nome da turma do banco
              turmaNome = turmaData.nome || turma;
              
              // Se tivermos o professor_id, buscamos os dados do professor
              if (turmaData.professor_id) {
                const { data: professorData, error: professorError } = await supabase
                  .from('professores')
                  .select('nome, slack_username')
                  .eq('id', turmaData.professor_id)
                  .single();
                  
                if (professorError) {
                  console.error('Erro ao buscar dados do professor:', professorError);
                } else if (professorData) {
                  console.log('Dados do professor obtidos:', JSON.stringify(professorData));
                  professorNome = professorData.nome || professor;
                  professorSlackUsername = professorData.slack_username || professorSlack;
                }
              }
            }
          }
        }
      } catch (dataError) {
        console.error('Erro ao buscar dados relacionados:', dataError);
      }
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
    
    const dataAlertaFormatada = formatarDataBrasileira(dataAlerta);
    
    // ID do Slack da coordenadora hardcoded
    const coordenadoraSlack = "chriskulza"; // ID da Chris Kulza
    
    // Link para o painel pedagógico
    const painelPedagogicoLink = "https://pedagogico.agenciakadin.com.br/painel-pedagogico";
    
    // Formatar a mensagem conforme o template
    let mensagem = `🚨🚨 *ALERTA: Farejei uma possível Evasão* 🚨🚨

*Aluno:* ${alunoNome}
*Turma:* ${turmaNome}
*Educador:* ${professorSlackUsername ? `<@${professorSlackUsername}>` : professorNome}
*Data do Aviso:* ${dataAlertaFormatada}
*Responsável Alerta:* ${responsavel}
*Informações:* ${descritivo}
*Origem do Alerta:* ${origem}
*Retenção agendada? Data:* ${dataRetencao || "Não agendada"}`;

    // Mencionar a Chris Kulza para acompanhamento
    mensagem += `\n<@${coordenadoraSlack}> para acompanhamento.`;
    
    // Adicionar link para o painel pedagógico
    mensagem += `\n\n<${painelPedagogicoLink}|👉 Ver no Painel Pedagógico>`;

    console.log('Enviando mensagem para o Slack:', mensagem);

    // Enviando para a API do Slack usando o token real
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SLACK_BOT_TOKEN}`,
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
