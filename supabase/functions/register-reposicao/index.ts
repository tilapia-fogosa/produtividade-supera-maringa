import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Background webhook processing function
async function processWebhookInBackground(
  supabase: any, 
  webhookUrl: string, 
  insertedReposicao: any, 
  body: any, 
  pessoaTipo: string
) {
  const webhookStartTime = Date.now();
  console.log(`[${new Date().toISOString()}] [WEBHOOK] Starting background webhook processing`);
  
  try {
    // Get additional data for webhook payload using parallel queries
    const [pessoaResult, turmaResult, unitResult] = await Promise.all([
      // Get person data (aluno or funcionario)
      pessoaTipo === 'aluno' 
        ? supabase.from('alunos').select('nome, telefone, email').eq('id', body.aluno_id).maybeSingle()
        : supabase.from('funcionarios').select('nome, telefone, email').eq('id', body.aluno_id).maybeSingle(),
      
      // Get turma data
      supabase.from('turmas').select('nome, professor_id, professores(nome)').eq('id', body.turma_id).single(),
      
      // Get unit data
      supabase.from('units').select('unit_number, name').eq('id', body.unit_id).single()
    ]);

    const pessoaData = pessoaResult.data;
    const turmaData = turmaResult.data;
    const unitData = unitResult.data;

    console.log(`[${new Date().toISOString()}] [WEBHOOK] Data fetched in ${Date.now() - webhookStartTime}ms`);

    // Construct webhook payload
    const webhookPayload = {
      tipo_evento: 'reposicao_registrada',
      data_evento: new Date().toISOString(),
      reposicao: {
        id: insertedReposicao.id,
        data_reposicao: insertedReposicao.data_reposicao,
        data_falta: insertedReposicao.data_falta,
        observacoes: insertedReposicao.observacoes,
        created_at: insertedReposicao.created_at
      },
      aluno: {
        id: body.aluno_id,
        nome: pessoaData?.nome,
        telefone: pessoaData?.telefone,
        email: pessoaData?.email
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

    console.log(`[${new Date().toISOString()}] [WEBHOOK] Sending webhook payload to:`, webhookUrl);

    // Send webhook with reduced timeout
    let webhookResponse;
    let webhookSuccess = false;

    try {
      const webhookRequestStartTime = Date.now();
      webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
        signal: AbortSignal.timeout(5000) // Reduced to 5 second timeout
      });

      webhookSuccess = webhookResponse.ok;
      const webhookRequestTime = Date.now() - webhookRequestStartTime;

      console.log(`[${new Date().toISOString()}] [WEBHOOK] Response received in ${webhookRequestTime}ms - Status:`, webhookResponse.status);
      
      if (!webhookSuccess) {
        const errorText = await webhookResponse.text();
        console.error(`[${new Date().toISOString()}] [WEBHOOK] Failed:`, errorText);
      }
    } catch (webhookError) {
      console.error(`[${new Date().toISOString()}] [WEBHOOK] Error:`, webhookError.message);
      webhookSuccess = false;
    }

    // Log webhook attempt
    await supabase
      .from('webhook_logs')
      .insert({
        webhook_url: webhookUrl,
        payload: webhookPayload,
        status_code: webhookResponse?.status || null,
        success: webhookSuccess,
        error_message: webhookSuccess ? null : 'Webhook delivery failed',
        entity_type: 'reposicao',
        entity_id: insertedReposicao.id
      });

    const totalWebhookTime = Date.now() - webhookStartTime;
    console.log(`[${new Date().toISOString()}] [WEBHOOK] Background processing completed in ${totalWebhookTime}ms - Success: ${webhookSuccess}`);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] [WEBHOOK] Background processing failed:`, error);
    
    // Still try to log the failure
    try {
      await supabase
        .from('webhook_logs')
        .insert({
          webhook_url: webhookUrl,
          payload: { error: 'Failed to construct payload' },
          status_code: null,
          success: false,
          error_message: error.message,
          entity_type: 'reposicao',
          entity_id: insertedReposicao.id
        });
    } catch (logError) {
      console.error(`[${new Date().toISOString()}] [WEBHOOK] Failed to log error:`, logError);
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Starting reposição registration`);
  
  try {
    // Parse request body
    const body = await req.json();
    console.log(`[${new Date().toISOString()}] Received reposição data:`, body);

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

    const dbStartTime = Date.now();
    console.log(`[${new Date().toISOString()}] Starting database operations`);

    // Determine if it's an aluno or funcionario
    let pessoaTipo = 'aluno';
    let pessoaId = body.aluno_id;

    // First check if it exists in alunos table
    const { data: alunoCheck } = await supabase
      .from('alunos')
      .select('id')
      .eq('id', body.aluno_id)
      .maybeSingle();

    if (!alunoCheck) {
      // If not found in alunos, check funcionarios table
      const { data: funcionarioCheck } = await supabase
        .from('funcionarios')
        .select('id')
        .eq('id', body.aluno_id)
        .maybeSingle();
      
      if (funcionarioCheck) {
        pessoaTipo = 'funcionario';
      } else {
        return new Response(
          JSON.stringify({ error: 'Person not found in alunos or funcionarios' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`[${new Date().toISOString()}] Person type determined: ${pessoaTipo}, ID: ${pessoaId}`);

    // Prepare reposição data with new structure
    const reposicaoData = {
      ...body,
      pessoa_id: pessoaId,
      pessoa_tipo: pessoaTipo
    };

    // Insert reposição data
    const { data: insertedReposicao, error: reposicaoError } = await supabase
      .from('reposicoes')
      .insert([reposicaoData])
      .select()
      .single();

    if (reposicaoError) {
      console.error('Error inserting reposição:', reposicaoError);
      throw reposicaoError;
    }

    const dbEndTime = Date.now();
    console.log(`[${new Date().toISOString()}] Reposição inserted successfully in ${dbEndTime - dbStartTime}ms:`, insertedReposicao.id);

    // Check for webhook configuration
    const { data: webhookData, error: webhookError } = await supabase
      .from('dados_importantes')
      .select('data')
      .eq('key', 'webhook_reposicoes')
      .single();

    if (webhookError || !webhookData?.data) {
      console.log(`[${new Date().toISOString()}] No webhook URL configured for reposições`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          reposicao: insertedReposicao,
          webhook_sent: false,
          execution_time: Date.now() - startTime,
          message: 'Reposição registrada, mas webhook não configurado'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process webhook in background using waitUntil
    const webhookPromise = processWebhookInBackground(
      supabase, 
      webhookData.data, 
      insertedReposicao, 
      body, 
      pessoaTipo
    );
    
    // Use EdgeRuntime.waitUntil to process webhook in background
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(webhookPromise);
    } else {
      // Fallback for environments without EdgeRuntime
      webhookPromise.catch(error => console.error('Background webhook error:', error));
    }

    const executionTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Response sent in ${executionTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        reposicao: insertedReposicao,
        webhook_sent: 'processing',
        execution_time: executionTime,
        message: 'Reposição registrada com sucesso'
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