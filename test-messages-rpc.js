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
        const targetPhone = "5543998754683";
        console.log("Fetching messages for phone:", targetPhone);

        // Test the messages RPC directly to avoid the conversations timeout
        const msgResp = await fetch(`${supabaseUrl}/rest/v1/rpc/get_commercial_messages_by_phone`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ p_telefone: targetPhone })
        });

        const bodyText = await msgResp.text();
        if (!msgResp.ok) {
            console.log("Error from messages RPC:", msgResp.status, msgResp.statusText, bodyText);
            return;
        }

        let msgs;
        try {
            msgs = JSON.parse(bodyText);
        } catch (e) {
            console.log("Failed to parse JSON:", bodyText);
            return;
        }

        const recentMsgs = Array.isArray(msgs) ? msgs.slice(-10) : []; // Last 10 messages
        console.log("Recent messages:", JSON.stringify(recentMsgs, null, 2));

    } catch (e) {
        console.error(e);
    }
}

run();
