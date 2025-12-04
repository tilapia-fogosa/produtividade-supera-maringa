import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// IPs permitidos para registro de ponto
const ALLOWED_IPS = ['179.177.2.39'];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ipinfoToken = Deno.env.get('IPINFO_API_KEY');
    
    if (!ipinfoToken) {
      console.error('IPINFO_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Configuração de API não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar IP do usuário via ipinfo.io
    const ipinfoResponse = await fetch(`https://ipinfo.io/json?token=${ipinfoToken}`);
    
    if (!ipinfoResponse.ok) {
      console.error('Erro ao consultar ipinfo.io:', ipinfoResponse.status);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar IP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ipData = await ipinfoResponse.json();
    const userIp = ipData.ip;
    
    console.log('IP do usuário:', userIp);
    console.log('IPs permitidos:', ALLOWED_IPS);

    const isAllowed = ALLOWED_IPS.includes(userIp);

    return new Response(
      JSON.stringify({
        allowed: isAllowed,
        ip: userIp,
        message: isAllowed 
          ? 'IP válido para registro de ponto' 
          : 'Você precisa estar conectado ao WiFi da empresa para registrar ponto'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro na validação de IP:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao validar IP' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
