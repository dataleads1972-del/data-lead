import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value.trim();
  }
}

const supabaseUrl = env.SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEvents() {
  await supabase.auth.signInWithPassword({
    email: 'dataleads1972@gmail.com',
    password: 'Dataleads1972@'
  });

  const { data: searches } = await supabase
    .from("searches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  console.log("\n--- Latest Searches ---");
  console.log(searches.map(s => ({
    id: s.id,
    keyword: s.keyword,
    status: s.status,
    leads_found: s.leads_found,
    error: s.error || s.error_message
  })));

  if (searches.length > 0) {
    const lastId = searches[0].id;
    console.log(`\n--- Events for Search ID ${lastId} ---`);
    const { data: events } = await supabase
      .from("agent_events")
      .select("*")
      .eq("search_id", lastId)
      .order("created_at", { ascending: true });

    console.log(events.map(e => `[${e.agent}] - ${e.status}: ${e.message}`));
  }
}

checkEvents();
