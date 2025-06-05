
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { ProdutividadeData } from "./types.ts";
import { createSupabaseClient, registrarDadosAluno, registrarProdutividade, excluirProdutividade, atualizarProdutividade } from "./database-service.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

serve(async (req) => {
  console.log('=== INÍCIO DA FUNÇÃO REGISTER-PRODUCTIVITY ===');
  console.log('Método da requisição:', req.method);
  console.log('Headers da requisição:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Retornando resposta CORS OPTIONS');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Iniciando função de registro de produtividade...');
    
    // Verificar variáveis de ambiente essenciais
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('SUPABASE_URL disponível:', !!supabaseUrl);
    console.log('SUPABASE_SERVICE_ROLE_KEY disponível:', !!supabaseServiceKey);
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas');
    }
    
    // Criar cliente Supabase para buscar configurações
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Cliente Supabase criado com sucesso');

    // Buscar webhook URL
    console.log('Buscando URL do webhook...');
    try {
      const { data: configData, error: configError } = await supabase
        .from('dados_importantes')
        .select('data')
        .eq('key', 'webhook_lançarprodutividade')
        .single();
      
      if (configError) {
        console.error('Erro ao buscar webhook URL:', configError);
        console.log('Continuando sem webhook...');
      } else if (!configData || !configData.data) {
        console.log('URL do webhook não encontrada, continuando sem webhook');
      } else {
        console.log('Webhook URL encontrada:', configData.data);
      }
    } catch (webhookConfigError) {
      console.error('Erro ao acessar configuração do webhook:', webhookConfigError);
      console.log('Continuando sem webhook...');
    }

    // Obter os dados da solicitação
    let requestData;
    try {
      requestData = await req.json();
      console.log('Dados da requisição recebidos:', JSON.stringify(requestData, null, 2));
    } catch (jsonError) {
      console.error('Erro ao fazer parse do JSON:', jsonError);
      return new Response(
        JSON.stringify({ error: 'Dados JSON inválidos' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Criar um cliente Supabase com o contexto de autenticação do usuário logado
    // Tornar Authorization opcional para debugging
    const authHeader = req.headers.get('Authorization');
    console.log('Header Authorization presente:', !!authHeader);
    
    let supabaseClient;
    try {
      if (authHeader) {
        supabaseClient = createSupabaseClient(authHeader);
      } else {
        console.log('Usando cliente sem autenticação para debugging');
        supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
      }
      console.log('Cliente Supabase com autenticação criado');
    } catch (clientError) {
      console.error('Erro ao criar cliente Supabase:', clientError);
      return new Response(
        JSON.stringify({ error: 'Erro na configuração do cliente Supabase' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Verificar a ação solicitada
    if (requestData.action === 'delete') {
      console.log('=== AÇÃO: DELETE ===');
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
      console.log('=== AÇÃO: UPDATE ===');
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
    console.log('=== AÇÃO: REGISTRO DE PRODUTIVIDADE ===');
    const data = requestData.data;
    
    console.log('Dados recebidos:', JSON.stringify(data, null, 2));
    
    if (!data) {
      console.error('Dados de produtividade não fornecidos');
      return new Response(
        JSON.stringify({ error: 'Dados de produtividade não fornecidos' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validar campos obrigatórios
    if (!data.pessoa_id) {
      console.error('pessoa_id não fornecido nos dados');
      return new Response(
        JSON.stringify({ error: 'pessoa_id é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('=== INICIANDO REGISTRO DE DADOS DO ALUNO ===');
    // Registrar dados do aluno no banco
    const sucessoBanco = await registrarDadosAluno(supabaseClient, data);
    
    if (!sucessoBanco) {
      console.error('Falhou ao atualizar dados do aluno/funcionário');
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar dados do aluno' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    console.log('Dados do aluno atualizados com sucesso');

    console.log('=== INICIANDO REGISTRO DE PRODUTIVIDADE ===');
    // Registrar produtividade nas tabelas do banco
    const sucessoProdutividade = await registrarProdutividade(supabaseClient, data);
    
    if (!sucessoProdutividade) {
      console.error('Falhou ao registrar produtividade');
      return new Response(
        JSON.stringify({ error: 'Erro ao registrar produtividade' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    console.log('Produtividade registrada com sucesso');

    // Tentativa de envio para webhook (opcional)
    console.log('=== TENTATIVA DE ENVIO PARA WEBHOOK ===');
    try {
      // Buscar webhook URL novamente para envio
      const { data: configData, error: configError } = await supabase
        .from('dados_importantes')
        .select('data')
        .eq('key', 'webhook_lançarprodutividade')
        .single();
      
      if (configError || !configData || !configData.data) {
        console.log('Webhook não configurado, finalizando sem envio para webhook');
      } else {
        const webhookUrl = configData.data;
        console.log('Enviando dados para webhook:', webhookUrl);
        
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
      }
      
    } catch (webhookError) {
      console.error('Erro ao processar webhook (continuando mesmo assim):', webhookError);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          webhookError: true,
          message: 'Dados salvos no banco, mas não foi possível sincronizar com o webhook: ' + webhookError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('=== SUCESSO TOTAL ===');
    // Retornar resposta de sucesso
    return new Response(
      JSON.stringify({ success: true, message: 'Produtividade registrada com sucesso!' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('=== ERRO GERAL NA FUNÇÃO ===');
    console.error('Stack trace completo:', error);
    console.error('Mensagem do erro:', error.message);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor: ' + error.message,
        details: error.stack 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
