import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Read VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY from .env
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = envFile.split('\n').reduce((acc, line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        acc[key.trim()] = valueParts.join('=').trim().replace(/['"]/g, '');
    }
    return acc;
}, {});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseKey = envVars['VITE_SUPABASE_PUBLISHABLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
    // 1. Get a unit ID to test with
    console.log('Fetching a unit ID...');
    const { data: units, error: unitError } = await supabase.from('units').select('id, name').limit(1);

    if (unitError || !units || units.length === 0) {
        console.error('Error fetching unit:', unitError);
        return;
    }

    const unitId = units[0].id;
    console.log(`Testing with Unit: ${units[0].name} (${unitId})`);

    // 2. Test the RPC explicitly
    console.log('\nCalling get_unit_clients_with_next_activity...');
    const { data: clients, error: rpcError } = await supabase.rpc('get_unit_clients_with_next_activity', {
        p_unit_id: unitId
    });

    if (rpcError) {
        console.error('RPC Error:', rpcError);
        return;
    }

    console.log(`Success! Found ${clients?.length || 0} clients.`);
    if (clients && clients.length > 0) {
        console.log('Sample client:', clients[0]);
    }
}

testRpc();
