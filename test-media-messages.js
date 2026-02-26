import fs from 'fs'

const envFile = fs.readFileSync('.env', 'utf-8')
const env = {}
envFile.split('\n').forEach(line => {
    const cleanLine = line.replace(/\r/g, '').trim()
    if (cleanLine && cleanLine.includes('=')) {
        const idx = cleanLine.indexOf('=')
        const key = cleanLine.substring(0, idx).trim()
        const value = cleanLine.substring(idx + 1).trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '')
        env[key] = value
    }
})

const supabaseUrl = env['VITE_SUPABASE_URL']
const supabaseKey = env['VITE_SUPABASE_PUBLISHABLE_KEY'] || env['VITE_SUPABASE_ANON_KEY']

async function getMediaMessages() {
    console.log("Fetching messages with media_url IS NOT NULL...");
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/historico_comercial?select=id,media_url,tipo_mensagem,mensagem&media_url=not.is.null&limit=5`, {
            method: 'GET',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        const data = await response.json();
        console.log("Media Messages:", JSON.stringify(data, null, 2));

        const rpcResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_commercial_messages_by_phone`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ p_telefone: '5544991444143' }) // Replace with a known phone if needed, but we just want to see if the RPC has 'url_media' or something else mapped.
        });
        // We'll just check the REST response for the actual row first.
    } catch (e) {
        console.error(e);
    }
}

getMediaMessages();
