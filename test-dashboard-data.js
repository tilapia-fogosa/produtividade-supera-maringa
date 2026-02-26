import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const VITE_SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL="(.*?)"/)[1];
const VITE_SUPABASE_PUBLISHABLE_KEY = envFile.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*?)"/)[1];

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY);

async function test() {
    console.log("Checking client_activities columns...");
    const { data: acts, error: err1 } = await supabase
        .from('client_activities')
        .select('*')
        .limit(1);

    if (err1) console.error("Act Error:", err1);
    else console.log("client_activities Data keys:", acts.length > 0 ? Object.keys(acts[0]) : "No data");

    console.log("\nChecking clients columns...");
    const { data: clients, error: err2 } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (err2) console.error("Clients Error:", err2);
    else console.log("clients Data keys:", clients.length > 0 ? Object.keys(clients[0]) : "No data");

    // Check if created_by is populated
    if (acts.length > 0) {
        console.log("Sample client_activities created_by:", acts[0]?.created_by, acts[0]?.user_id);
    }

    if (clients && clients.length > 0) {
        console.log("\nTrying RPC get_sdr_performance with a wide date range...");
        const { data: rpc, error: rpcErr } = await supabase.rpc('get_sdr_performance', {
            p_unit_ids: [clients[0].unit_id],
            p_start_date: '2020-01-01T00:00:00Z',
            p_end_date: '2027-01-01T00:00:00Z'
        });

        if (rpcErr) console.error("RPC Error:", rpcErr);
        else console.log("RPC Result:", rpc);

        console.log("\nTrying RPC get_closer_performance...");
        const { data: rpc2, error: rpcErr2 } = await supabase.rpc('get_closer_performance', {
            p_unit_ids: [clients[0].unit_id],
            p_start_date: '2020-01-01T00:00:00Z',
            p_end_date: '2027-01-01T00:00:00Z'
        });

        if (rpcErr2) console.error("RPC Error:", rpcErr2);
        else console.log("RPC Result 2:", rpc2);
    }
}

test();
