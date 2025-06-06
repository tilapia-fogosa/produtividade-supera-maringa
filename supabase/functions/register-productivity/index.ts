
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { ProdutividadeData } from "./types.ts";
import { createSupabaseClient, registrarDadosAluno, registrarProdutividade, excluirProdutividade, atualizarProdutividade } from "./database-service.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Iniciando função de registro de produtividade...');
    
    // Criar cliente Supabase para buscar configurações
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Obter os dados da solicitação
    const requestData = await req.json();
    console.log('Dados da requisição:', JSON.stringify(requestData, null, 2));
    
    // Criar um cliente Supabase com o contexto de autenticação do usuário logado
    const supabaseClient = createSupabaseClient(req.headers.get('Authorization')!);
    
    // Verificar a ação solicitada
    if (requestData.action === 'delete') {
      console.log('Solicitação de exclusão recebida:', requestData.id);
      
      const sucessoExclusao = await excluirProdutividade(supabaseClient, requestData.id);
      
      if (!sucessoExclusao) {
        return new Response(
          JSON.stringify({ error: 'Erro ao excluir registro de produtividade' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'Registro excluído com sucesso!' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (requestData.action === 'update') {
      console.log('Solicitação de atualização recebida:', requestData.data);
      
      const sucessoAtualizacao = await atualizarProdutividade(supabaseClient, requestData.data);
      
      if (!sucessoAtualizacao) {
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar registro de produtividade' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'Registro atualizado com sucesso!' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Processamento padrão para registro de produtividade
    const data = requestData.data;
    
    console.log('Dados recebidos:', JSON.stringify(data, null, 2));
    
    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Dados de produtividade não fornecidos' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Registrar dados do aluno no banco
    console.log('Registrando dados do aluno/funcionário...');
    const sucessoBanco = await registrarDadosAluno(supabaseClient, data);
    
    if (!sucessoBanco) {
      console.error('Falha ao atualizar dados do aluno/funcionário');
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar dados do aluno' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Registrar produtividade nas tabelas do banco
    console.log('Registrando produtividade...');
    const sucessoProdutividade = await registrarProdutividade(supabaseClient, data);
    
    if (!sucessoProdutividade) {
      console.error('Falha ao registrar produtividade');
      return new Response(
        JSON.stringify({ error: 'Erro ao registrar produtividade' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Se foi registrada uma falta, chamar a função de verificação de alertas
    // CORREÇÃO: Mudando de aluno_id para pessoa_id
    console.log('Verificando se é uma falta para chamar check-missing-attendance...');
    console.log('data.presente:', data.presente);
    console.log('data.aluno_id (antigo):', data.aluno_id); 
    console.log('data.pessoa_id (novo):', data.pessoa_id);
    
    if (!data.presente && data.pessoa_id) {
      console.log('✅ Falta registrada, verificando critérios de alerta para pessoa_id:', data.pessoa_id);
      
      try {
        console.log('🔄 Chamando função check-missing-attendance...');
        const { data: alertaData, error: alertaError } = await supabase.functions.invoke('check-missing-attendance', {
          body: { pessoa_id: data.pessoa_id }
        });
        
        if (alertaError) {
          console.error('❌ Erro ao verificar alertas de falta:', alertaError);
          // Não falhar o registro por causa disso, apenas logar
        } else {
          console.log('✅ Verificação de alertas concluída com sucesso:', alertaData);
        }
      } catch (error) {
        console.error('❌ Erro inesperado ao verificar alertas:', error);
        // Não falhar o registro por causa disso, apenas logar
      }
    } else {
      console.log('❌ Não é uma falta ou pessoa_id não fornecido - não chamando check-missing-attendance');
      console.log('Motivos:');
      console.log('- É presença?', data.presente);
      console.log('- Tem pessoa_id?', !!data.pessoa_id);
    }

    // Tentar envio para webhook (apenas se configurado)
    let webhookResult = null;
    try {
      console.log('Verificando configuração do webhook...');
      const { data: configData, error: configError } = await supabase
        .from('dados_importantes')
        .select('data')
        .eq('key', 'webhook_lançarprodutividade')
        .single();
      
      if (configError || !configData || !configData.data) {
        console.log('Webhook não configurado, continuando sem envio');
      } else {
        const webhookUrl = configData.data;
        console.log('Enviando para webhook:', webhookUrl);
        
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro ao enviar dados para o webhook: ${errorText}`);
        }

        console.log('Dados enviados com sucesso para o webhook!');
        webhookResult = { success: true };
      }
      
    } catch (webhookError) {
      console.error('Erro ao processar webhook (continuando):', webhookError);
      webhookResult = { 
        error: true, 
        message: 'Dados salvos, mas não foi possível sincronizar com webhook: ' + webhookError.message 
      };
    }

    // Retornar resposta de sucesso
    const response = { 
      success: true, 
      message: 'Produtividade registrada com sucesso!',
      isAbsence: !data.presente
    };
    
    if (webhookResult?.error) {
      response.webhookError = true;
      response.message = webhookResult.message;
    }
    
    console.log('Registro concluído com sucesso');
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
