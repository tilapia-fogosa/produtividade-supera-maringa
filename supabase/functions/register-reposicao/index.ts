import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await req.json();
    console.log('Received reposição data:', body);

    // Validate required fields
    if (!body.aluno_id || !body.turma_id || !body.data_reposicao || !body.responsavel_id || !body.unit_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert reposição data
    const { data: reposicaoData, error: reposicaoError } = await supabase
      .from('reposicoes')
      .insert([body])
      .select()
      .single();

    if (reposicaoError) {
      console.error('Error inserting reposição:', reposicaoError);
      throw reposicaoError;
    }

    console.log('Reposição inserted successfully:', reposicaoData);

    // Check if we need to create a future absence
    let faltaFuturaData = null;
    if (body.data_falta) {
      const dataFalta = new Date(body.data_falta);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      dataFalta.setHours(0, 0, 0, 0);
      
      if (dataFalta > hoje) {
        console.log('Creating future absence for date:', body.data_falta);
        
        // Create future absence record
        const { data: faltaData, error: faltaError } = await supabase
          .from('faltas_antecipadas')
          .insert([{
            aluno_id: body.aluno_id,
            turma_id: body.turma_id,
            unit_id: body.unit_id,
            data_falta: body.data_falta,
            responsavel_aviso_id: body.responsavel_id,
            responsavel_aviso_tipo: body.responsavel_tipo,
            responsavel_aviso_nome: body.nome_responsavel,
            observacoes: body.observacoes ? `Falta futura registrada via reposição: ${body.observacoes}` : 'Falta futura registrada via reposição',
            created_by: body.created_by
          }])
          .select()
          .single();

        if (faltaError) {
          console.error('Error creating future absence:', faltaError);
          // Note: We don't throw here to avoid breaking the reposition creation
        } else {
          faltaFuturaData = faltaData;
          console.log('Future absence created successfully:', faltaFuturaData);
        }
      }
    }

    // Get webhook URL from dados_importantes
    const { data: webhookData, error: webhookError } = await supabase
      .from('dados_importantes')
      .select('data')
      .eq('key', 'webhook_reposicoes')
      .single();

    if (webhookError || !webhookData?.data) {
      console.log('No webhook URL configured for reposições');
      return new Response(
        JSON.stringify({ 
          success: true, 
          reposicao: reposicaoData,
          falta_futura: faltaFuturaData,
          webhook_sent: false,
          message: faltaFuturaData 
            ? 'Reposição e falta futura registradas, mas webhook não configurado'
            : 'Reposição registrada, mas webhook não configurado'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get additional data for webhook payload
    const { data: alunoData } = await supabase
      .from('alunos')
      .select('nome, telefone, email')
      .eq('id', body.aluno_id)
      .single();

    const { data: turmaData } = await supabase
      .from('turmas')
      .select('nome, professor_id, professores(nome)')
      .eq('id', body.turma_id)
      .single();

    const { data: unitData } = await supabase
      .from('units')
      .select('unit_number, name')
      .eq('id', body.unit_id)
      .single();

    // Construct webhook payload
    const webhookPayload = {
      tipo_evento: 'reposicao_registrada',
      data_evento: new Date().toISOString(),
      reposicao: {
        id: reposicaoData.id,
        data_reposicao: reposicaoData.data_reposicao,
        data_falta: reposicaoData.data_falta,
        observacoes: reposicaoData.observacoes,
        created_at: reposicaoData.created_at
      },
      aluno: {
        id: body.aluno_id,
        nome: alunoData?.nome,
        telefone: alunoData?.telefone,
        email: alunoData?.email
      },
      turma: {
        id: body.turma_id,
        nome: turmaData?.nome,
        professor: turmaData?.professores?.nome
      },
      responsavel: {
        id: body.responsavel_id,
        tipo: body.responsavel_tipo,
        nome: body.nome_responsavel
      },
      unidade: {
        id: body.unit_id,
        numero: unitData?.unit_number,
        nome: unitData?.name
      }
    };

    console.log('Sending webhook payload:', webhookPayload);

    // Send webhook
    let webhookResponse;
    let webhookSuccess = false;

    try {
      const webhookRequest = fetch(webhookData.data, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      webhookResponse = await webhookRequest;
      webhookSuccess = webhookResponse.ok;

      console.log('Webhook response status:', webhookResponse.status);
      
      if (!webhookSuccess) {
        const errorText = await webhookResponse.text();
        console.error('Webhook failed:', errorText);
      }
    } catch (webhookError) {
      console.error('Error sending webhook:', webhookError);
      webhookSuccess = false;
    }

    // Log webhook attempt
    await supabase
      .from('webhook_logs')
      .insert({
        webhook_url: webhookData.data,
        payload: webhookPayload,
        status_code: webhookResponse?.status || null,
        success: webhookSuccess,
        error_message: webhookSuccess ? null : 'Webhook delivery failed',
        entity_type: 'reposicao',
        entity_id: reposicaoData.id
      });

    const executionTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        reposicao: reposicaoData,
        falta_futura: faltaFuturaData,
        webhook_sent: webhookSuccess,
        webhook_status: webhookResponse?.status || null,
        execution_time: executionTime,
        message: faltaFuturaData 
          ? 'Reposição e falta futura registradas com sucesso'
          : 'Reposição registrada com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in register-reposicao function:', error);
    
    const executionTime = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        execution_time: executionTime
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});