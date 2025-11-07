import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Lidar com requisições CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log('=== INICIANDO ENVIO DE ALERTA DE FALTA PARA WEBHOOK ===');
    
    // 1. Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // 2. Buscar URL do webhook da tabela dados_importantes (id = 15)
    console.log('Buscando URL do webhook na tabela dados_importantes...');
    const { data: webhookData, error: webhookError } = await supabaseClient
      .from('dados_importantes')
      .select('data')
      .eq('id', 15)
      .single();
    
    if (webhookError || !webhookData) {
      console.error('Erro ao buscar webhook:', webhookError);
      return new Response(
        JSON.stringify({ success: false, error: 'Webhook não encontrado na tabela dados_importantes (id=15)' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
    
    const webhookUrl = webhookData.data;
    console.log('Webhook URL encontrada:', webhookUrl);
    
    // 3. Obter dados da requisição
    const alertaData = await req.json();
    
    console.log('Dados do alerta recebidos:', alertaData);
    
    // 4. Validar dados obrigatórios
    const { aluno_nome, professor_nome, turma_nome, data_falta } = alertaData;
    if (!aluno_nome || !professor_nome || !turma_nome || !data_falta) {
      console.error('Dados obrigatórios ausentes');
      return new Response(
        JSON.stringify({ success: false, error: 'Dados obrigatórios ausentes: aluno_nome, professor_nome, turma_nome, data_falta' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    // 5. Montar payload para enviar ao webhook
    const payload = {
      aluno_nome: alertaData.aluno_nome,
      professor_nome: alertaData.professor_nome,
      professor_slack: alertaData.professor_slack || null,
      turma_nome: alertaData.turma_nome,
      dias_supera: alertaData.dias_supera || null,
      data_falta: alertaData.data_falta,
      faltas_consecutivas: alertaData.faltas_consecutivas || null,
      motivo_falta: alertaData.motivo_falta || 'Não informado',
      tipo_criterio: alertaData.tipo_criterio || null,
      timestamp: new Date().toISOString()
    };
    
    console.log('Payload montado para webhook:', payload);
    
    // 6. Enviar para webhook com timeout de 10 segundos
    console.log('Enviando dados para webhook N8N...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos
    
    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('Status da resposta do webhook:', webhookResponse.status);
      
      // 7. Processar resposta
      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('Erro na resposta do webhook:', errorText);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Webhook retornou erro',
            status: webhookResponse.status,
            details: errorText
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }
      
      const responseData = await webhookResponse.text();
      console.log('Resposta do webhook:', responseData);
      
      console.log('✅ Alerta enviado com sucesso para o webhook');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Alerta de falta enviado com sucesso para o webhook N8N',
          webhook_response: responseData
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Timeout ao enviar para webhook');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Timeout ao enviar para webhook (10 segundos)' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 504 
          }
        );
      }
      
      throw fetchError;
    }
    
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
