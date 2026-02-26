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

async function getMedia() {
    console.log("Fetching messages audio/ptt...");
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/historico_comercial?select=id,media_url,tipo_mensagem,mensagem&tipo_mensagem=in.(audio,ptt)&limit=5`, {
            method: 'GET',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        const data = await response.json();
        console.log("Audio Messages:", JSON.stringify(data, null, 2));

        const allResponse = await fetch(`${supabaseUrl}/rest/v1/historico_comercial?select=tipo_mensagem&limit=100`, {
            method: 'GET',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        const allData = await allResponse.json();
        const types = [...new Set(allData.map(d => d.tipo_mensagem))];
        console.log("Unique tipo_mensagem values:", types);

    } catch (e) {
        console.error(e);
    }
}

getMedia();
