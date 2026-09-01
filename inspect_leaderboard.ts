import { createClient } from '@supabase/supabase-js';

const url = 'https://zaweivmgzxjfthvkkmzl.supabase.co';
const key = 'sb_publishable_jmJ1F5fwyPLFV34h-LE03Q_bmQQDHoY';
const supabase = createClient(url, key);

async function inspectLeaderboard() {
  const { data, error } = await supabase.from('leaderboard_entries').select('*').limit(10);
  if (error) {
    console.error('Error fetching leaderboard:', error);
  } else {
    console.log('Leaderboard entries:', data);
  }
}

inspectLeaderboard();
