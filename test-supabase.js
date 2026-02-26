import { createClient } from '@supabase/supabase-js'
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

async function test() {
  console.log("Fetching latest from historico_comercial...");
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/historico_comercial?select=created_at,mensagem,client_id&order=created_at.desc&limit=10`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    const data = await response.json();
    console.log("REST Data Length:", data.length);
    data.forEach(d => console.log(d.created_at, d.client_id, d.mensagem?.substring(0, 30)));
  } catch (e) {
    console.log(e);
  }
}

test()
