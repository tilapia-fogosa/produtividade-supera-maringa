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

async function run() {
    try {
        // We can't query the table directly if RLS is on, but we can try with the anon key
        // Let's see if we can get the columns of historico_comercial
        const resp = await fetch(`${supabaseUrl}/rest/v1/historico_comercial?limit=1`, {
            method: 'GET',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            }
        });

        const bodyText = await resp.text();
        console.log("Status:", resp.status);
        console.log("Body:", bodyText);
    } catch (e) {
        console.error(e);
    }
}

run();
