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
    // Pegar IP do cliente dos headers (Supabase passa o IP real)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    
    // Usar o primeiro IP disponível
    let clientIp = cfConnectingIp || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null);
    
    console.log('Headers de IP:', {
      'x-forwarded-for': forwardedFor,
      'x-real-ip': realIp,
      'cf-connecting-ip': cfConnectingIp,
    });
    
    // Se não conseguiu pelo header, usar ipinfo como fallback
    if (!clientIp) {
      const ipinfoToken = Deno.env.get('IPINFO_API_KEY');
      if (ipinfoToken) {
        const ipinfoResponse = await fetch(`https://ipinfo.io/json?token=${ipinfoToken}`);
        if (ipinfoResponse.ok) {
          const ipData = await ipinfoResponse.json();
          clientIp = ipData.ip;
          console.log('IP obtido via ipinfo (fallback):', clientIp);
        }
      }
    }
    
    if (!clientIp) {
      console.error('Não foi possível determinar o IP do cliente');
      return new Response(
        JSON.stringify({ error: 'Não foi possível verificar seu IP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('IP do cliente:', clientIp);
    console.log('IPs permitidos:', ALLOWED_IPS);

    const isAllowed = ALLOWED_IPS.includes(clientIp);

    return new Response(
      JSON.stringify({
        allowed: isAllowed,
        ip: clientIp,
        message: isAllowed 
          ? 'IP válido para registro de ponto' 
          : `Você precisa estar conectado ao WiFi da empresa para registrar ponto (seu IP: ${clientIp})`
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
