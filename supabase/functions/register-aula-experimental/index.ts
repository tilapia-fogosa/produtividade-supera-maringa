import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const aulaExperimentalData = await req.json();
    console.log('📚 Dados da aula experimental recebidos:', aulaExperimentalData);

    // 1. Inserir a aula experimental na base de dados
    const { data: aulaExperimental, error: insertError } = await supabase
      .from('aulas_experimentais')
      .insert([aulaExperimentalData])
      .select('*')
      .single();

    if (insertError) {
      console.error('❌ Erro ao inserir aula experimental:', insertError);
      throw new Error(`Erro ao inserir aula experimental: ${insertError.message}`);
    }

    console.log('✅ Aula experimental inserida com sucesso:', aulaExperimental.id);

    // 2. Buscar dados complementares para o webhook
    const [turmaResult, responsavelResult, unitResult] = await Promise.all([
      // Buscar dados da turma
      supabase
        .from('turmas')
        .select('nome, professor_id, dia_semana')
        .eq('id', aulaExperimental.turma_id)
        .single(),
      
      // Buscar dados do responsável (professor ou funcionário)
      aulaExperimental.responsavel_tipo === 'professor'
        ? supabase
            .from('professores')
            .select('nome, slack_username')
            .eq('id', aulaExperimental.responsavel_id)
            .single()
        : supabase
            .from('funcionarios') 
            .select('nome, cargo')
            .eq('id', aulaExperimental.responsavel_id)
            .single(),
      
      // Buscar dados da unidade
      supabase
        .from('units')
        .select('unit_number, name')
        .eq('id', aulaExperimental.unit_id)
        .single()
    ]);

    const turma = turmaResult.data;
    const responsavel = responsavelResult.data;
    const unit = unitResult.data;

    if (turmaResult.error) {
      console.error('❌ Erro ao buscar turma:', turmaResult.error);
    }
    if (responsavelResult.error) {
      console.error('❌ Erro ao buscar responsável:', responsavelResult.error);
    }
    if (unitResult.error) {
      console.error('❌ Erro ao buscar unidade:', unitResult.error);
    }

    // 3. Buscar URL do webhook (usando RPC para lidar com espaços em branco)
    const { data: webhookRows, error: webhookError } = await supabase
      .rpc('get_webhook_url', { webhook_key: 'webhook_aula_experimental' })
      .single();
    
    // Se não funcionou com RPC, tenta com busca direta
    let webhookConfig = null;
    if (!webhookError && webhookRows) {
      webhookConfig = webhookRows;
    } else {
      const { data: directConfig } = await supabase
        .from('dados_importantes')
        .select('data')
        .ilike('key', '%webhook_aula_experimental%')
        .maybeSingle();
      webhookConfig = directConfig;
    }

    let webhookSent = false;
    let webhookError_msg = null;

    if (!webhookConfig?.data) {
      console.log('⚠️ URL do webhook não configurada ou não encontrada');
      webhookError_msg = 'URL do webhook não configurada';
    } else {
      // 4. Preparar payload do webhook
      const webhookPayload = {
        tipo: 'aula_experimental',
        aula_experimental_id: aulaExperimental.id,
        data_aula_experimental: aulaExperimental.data_aula_experimental,
        cliente: {
          nome: aulaExperimental.cliente_nome,
          descricao: aulaExperimental.descricao_cliente
        },
        turma: {
          id: aulaExperimental.turma_id,
          nome: turma?.nome || 'Nome não encontrado',
          dia_semana: turma?.dia_semana || null
        },
        responsavel: {
          id: aulaExperimental.responsavel_id,
          nome: aulaExperimental.responsavel_nome || responsavel?.nome || 'Nome não encontrado',
          tipo: aulaExperimental.responsavel_tipo,
          slack_username: responsavel?.slack_username || null,
          cargo: responsavel?.cargo || null
        },
        unidade: {
          id: aulaExperimental.unit_id,
          numero: unit?.unit_number || null,
          nome: unit?.name || 'Unidade não encontrada'
        },
        created_at: aulaExperimental.created_at,
        created_by: aulaExperimental.created_by
      };

      console.log('📤 Enviando webhook para:', webhookConfig.data);
      console.log('📦 Payload:', JSON.stringify(webhookPayload, null, 2));

      // 5. Enviar webhook
      try {
        const webhookResponse = await fetch(webhookConfig.data, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
          signal: AbortSignal.timeout(10000) // Timeout de 10 segundos
        });

        if (webhookResponse.ok) {
          console.log('✅ Webhook enviado com sucesso');
          webhookSent = true;
        } else {
          const errorText = await webhookResponse.text();
          console.error('❌ Erro no webhook - Status:', webhookResponse.status);
          console.error('❌ Erro no webhook - Response:', errorText);
          webhookError_msg = `HTTP ${webhookResponse.status}: ${errorText}`;
        }
      } catch (webhookErr) {
        console.error('❌ Erro ao enviar webhook:', webhookErr);
        webhookError_msg = webhookErr.message;
      }
    }

    // 6. Log do resultado
    console.log(`📊 Resultado final:
      - Aula experimental inserida: ✅
      - Webhook enviado: ${webhookSent ? '✅' : '❌'}
      - Erro no webhook: ${webhookError_msg || 'Nenhum'}
    `);

    return new Response(
      JSON.stringify({
        success: true,
        aulaExperimental,
        webhookSent,
        webhookError: webhookError_msg
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('💥 Erro geral:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        webhookSent: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});