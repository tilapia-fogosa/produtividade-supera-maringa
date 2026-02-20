
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const WEBHOOK_URL = 'https://hook.us1.make.com/piv9marlfbof9g9ekfwt3gsc296ld64m';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Executa a função que verifica os lançamentos pendentes
    const { error } = await supabase.rpc('check_lancamentos_pendentes')
    
    if (error) throw error

    // Buscar alertas novos que não tiveram webhook enviado
    const { data: novosAlertas, error: alertasError } = await supabase
      .from('alertas_lancamento')
      .select(`
        id,
        turmas (
          nome,
          professor:professores(nome)
        ),
        data_aula
      `)
      .eq('webhook_enviado', false)
      .eq('status', 'pendente')

    if (alertasError) throw alertasError

    // Enviar webhook para cada alerta novo
    for (const alerta of novosAlertas || []) {
      try {
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'alerta_lancamento',
            turma: alerta.turmas.nome,
            professor: alerta.turmas.professor.nome,
            data_aula: alerta.data_aula,
            criado_em: new Date().toISOString()
          })
        })

        // Registrar resultado do webhook
        await supabase.from('webhook_logs').insert({
          alerta_id: alerta.id,
          status: response.ok ? 'success' : 'error',
          response_code: response.status,
          response_body: await response.text()
        })

        // Marcar alerta como enviado
        if (response.ok) {
          await supabase
            .from('alertas_lancamento')
            .update({ webhook_enviado: true })
            .eq('id', alerta.id)
        }
      } catch (webhookError) {
        console.error('Erro ao enviar webhook:', webhookError)
        await supabase.from('webhook_logs').insert({
          alerta_id: alerta.id,
          status: 'error',
          error_message: webhookError.message
        })
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error('Erro:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

