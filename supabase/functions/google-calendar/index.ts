import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para criar JWT para autenticação com Google
async function createGoogleJWT(serviceAccountKey: any): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccountKey.client_email,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Importar a chave privada
  const pemContent = serviceAccountKey.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContent), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${unsignedToken}.${signatureB64}`;
}

// Função para obter access token do Google
async function getGoogleAccessToken(serviceAccountKey: any): Promise<string> {
  const jwt = await createGoogleJWT(serviceAccountKey);
  
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Erro ao obter token Google:", error);
    throw new Error(`Falha ao obter token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountKeyRaw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKeyRaw) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY não configurada');
    }

    const serviceAccountKey = JSON.parse(serviceAccountKeyRaw);
    const accessToken = await getGoogleAccessToken(serviceAccountKey);

    const { action, calendarId, eventId, eventData, timeMin, timeMax } = await req.json();

    console.log(`[Google Calendar] Action: ${action}, Calendar: ${calendarId}`);

    const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    let response;
    let result;

    switch (action) {
      case 'test-connection':
        // Testar se o calendário está acessível
        response = await fetch(`${baseUrl}`, { headers });
        if (!response.ok) {
          const error = await response.text();
          console.error("Erro ao acessar calendário:", error);
          if (response.status === 404) {
            throw new Error('Calendário não encontrado. Verifique o ID do calendário.');
          }
          if (response.status === 403) {
            throw new Error(`Calendário não compartilhado com ${serviceAccountKey.client_email}. Por favor, compartilhe o calendário com este email.`);
          }
          throw new Error(`Erro ao acessar calendário: ${response.status}`);
        }
        result = await response.json();
        return new Response(JSON.stringify({ 
          success: true, 
          calendarName: result.summary,
          message: `Conectado ao calendário: ${result.summary}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'list-events':
        const params = new URLSearchParams({
          maxResults: '50',
          singleEvents: 'true',
          orderBy: 'startTime',
        });
        if (timeMin) params.append('timeMin', timeMin);
        if (timeMax) params.append('timeMax', timeMax);

        response = await fetch(`${baseUrl}/events?${params}`, { headers });
        if (!response.ok) {
          const error = await response.text();
          console.error("Erro ao listar eventos:", error);
          throw new Error(`Erro ao listar eventos: ${response.status}`);
        }
        result = await response.json();
        return new Response(JSON.stringify({ 
          success: true, 
          events: result.items || [] 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'create-event':
        response = await fetch(`${baseUrl}/events`, {
          method: 'POST',
          headers,
          body: JSON.stringify(eventData),
        });
        if (!response.ok) {
          const error = await response.text();
          console.error("Erro ao criar evento:", error);
          throw new Error(`Erro ao criar evento: ${response.status}`);
        }
        result = await response.json();
        console.log(`[Google Calendar] Evento criado: ${result.id}`);
        return new Response(JSON.stringify({ 
          success: true, 
          event: result 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'update-event':
        response = await fetch(`${baseUrl}/events/${eventId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(eventData),
        });
        if (!response.ok) {
          const error = await response.text();
          console.error("Erro ao atualizar evento:", error);
          throw new Error(`Erro ao atualizar evento: ${response.status}`);
        }
        result = await response.json();
        console.log(`[Google Calendar] Evento atualizado: ${result.id}`);
        return new Response(JSON.stringify({ 
          success: true, 
          event: result 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'delete-event':
        response = await fetch(`${baseUrl}/events/${eventId}`, {
          method: 'DELETE',
          headers,
        });
        if (!response.ok && response.status !== 204) {
          const error = await response.text();
          console.error("Erro ao deletar evento:", error);
          throw new Error(`Erro ao deletar evento: ${response.status}`);
        }
        console.log(`[Google Calendar] Evento deletado: ${eventId}`);
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Evento deletado com sucesso' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }
  } catch (error) {
    console.error('[Google Calendar] Erro:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
