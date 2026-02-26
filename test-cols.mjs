import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

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

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    const { data, error } = await supabase.from('clients').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
    } else {
        if (data && data.length > 0) {
            console.log('Columns in clients table:', Object.keys(data[0]));
        } else {
            console.log('No rows returned, but query succeeded.');
        }
    }
}
checkColumns();
