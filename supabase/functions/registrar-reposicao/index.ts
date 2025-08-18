import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Iniciando registro de reposição...');
    
    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Parse do body da requisição
    const reposicaoData = await req.json();
    console.log('Dados da reposição recebidos:', reposicaoData);

    // 1. Inserir a reposição no banco
    const { data: reposicaoInsert, error: reposicaoError } = await supabase
      .from('reposicoes')
      .insert(reposicaoData)
      .select()
      .single();

    if (reposicaoError) {
      console.error('Erro ao inserir reposição:', reposicaoError);
      throw reposicaoError;
    }

    console.log('Reposição inserida com sucesso:', reposicaoInsert);

    // 2. Buscar dados relacionados para o webhook
    const { data: dadosCompletos, error: dadosError } = await supabase
      .from('reposicoes')
      .select(`
        *,
        alunos!inner(nome, telefone, email, dias_supera),
        turmas!inner(nome, dia_semana, horario_inicio, professor_id, professores(nome, slack_username))
      `)
      .eq('id', reposicaoInsert.id)
      .single();

    if (dadosError) {
      console.error('Erro ao buscar dados completos:', dadosError);
      throw dadosError;
    }

    // 3. Buscar webhook URL da tabela dados_importantes
    const { data: webhookConfig, error: webhookError } = await supabase
      .from('dados_importantes')
      .select('data')
      .eq('key', 'webhook_reposicoes')
      .single();

    if (webhookError) {
      console.error('Erro ao buscar webhook URL:', webhookError);
      throw new Error('Webhook URL não encontrada na configuração');
    }

    const webhookUrl = webhookConfig.data;
    console.log('Webhook URL encontrada:', webhookUrl);

    // 4. Preparar payload para o webhook
    const webhookPayload = {
      tipo: 'reposicao',
      timestamp: new Date().toISOString(),
      reposicao: {
        id: dadosCompletos.id,
        data_reposicao: dadosCompletos.data_reposicao,
        observacoes: dadosCompletos.observacoes,
        responsavel: dadosCompletos.responsavel,
        created_at: dadosCompletos.created_at
      },
      aluno: {
        id: dadosCompletos.aluno_id,
        nome: dadosCompletos.alunos.nome,
        telefone: dadosCompletos.alunos.telefone,
        email: dadosCompletos.alunos.email,
        dias_supera: dadosCompletos.alunos.dias_supera
      },
      turma_reposicao: {
        id: dadosCompletos.turma_id,
        nome: dadosCompletos.turmas.nome,
        dia_semana: dadosCompletos.turmas.dia_semana,
        horario_inicio: dadosCompletos.turmas.horario_inicio
      },
      professor: {
        id: dadosCompletos.turmas.professor_id,
        nome: dadosCompletos.turmas.professores?.nome,
        slack_username: dadosCompletos.turmas.professores?.slack_username
      }
    };

    console.log('Payload preparado para webhook:', JSON.stringify(webhookPayload, null, 2));

    // 5. Enviar webhook
    if (webhookUrl) {
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload)
        });

        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text();
          console.error('Erro no webhook:', errorText);
        } else {
          console.log('Webhook enviado com sucesso!');
        }
      } catch (webhookErr) {
        console.error('Erro ao enviar webhook:', webhookErr);
        // Não falha a operação se o webhook falhar
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: reposicaoInsert,
        webhook_sent: !!webhookUrl 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});