
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
      turma = "",
      professor = "",
      professorSlack = null,
      cardId = "",
      alunoId = "" // Novo parâmetro para buscar dados dinâmicos
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
        // Primeira abordagem: buscar aluno e fazer JOIN com turma e professor
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
            // Agora buscar os dados da turma
            const { data: turmaData, error: turmaError } = await supabase
              .from('turmas')
              .select('nome, dia_semana, horario, professor_id')
              .eq('id', alunoData.turma_id)
              .single();
              
            if (turmaError) {
              console.error('Erro ao buscar dados da turma:', turmaError);
            } else if (turmaData) {
              console.log('Dados da turma obtidos:', JSON.stringify(turmaData));
              
              // Formatar dia da semana
              let diaSemanaFormatado = '';
              switch (turmaData.dia_semana) {
                case "segunda": diaSemanaFormatado = '2ª'; break;
                case "terca": diaSemanaFormatado = '3ª'; break;
                case "quarta": diaSemanaFormatado = '4ª'; break;
                case "quinta": diaSemanaFormatado = '5ª'; break;
                case "sexta": diaSemanaFormatado = '6ª'; break;
                case "sabado": diaSemanaFormatado = 'Sábado'; break;
                case "domingo": diaSemanaFormatado = 'Domingo'; break;
                default: diaSemanaFormatado = turmaData.dia_semana;
              }
              
              // Formatar horário
              const horario = turmaData.horario ? turmaData.horario.substring(0, 5) : '00:00';
              turmaNome = `${diaSemanaFormatado} (${horario} - 60+)`;
              
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
    
    // Buscar o ID do Slack da coordenadora Chris Kulza
    let coordenadoraSlack = "chriskulza"; // ID correto da Chris Kulza
    
    // Link para o painel pedagógico
    const painelPedagogicoLink = "https://pedagogico.agenciakadin.com.br/painel-pedagogico";
    
    // Formatar a mensagem conforme o template
    let mensagem = `🚨🚨 *ALERTA: Farejei uma possível Evasão* 🚨🚨

*Aluno:* ${alunoNome}
*Turma:* ${turmaNome}
*Educador:* ${professorSlackUsername ? `<@${professorSlackUsername}>` : professorNome}
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
