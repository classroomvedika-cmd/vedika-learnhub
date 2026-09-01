import { createClient } from '@supabase/supabase-js';

const url = 'https://zaweivmgzxjfthvkkmzl.supabase.co';
const key = 'sb_publishable_jmJ1F5fwyPLFV34h-LE03Q_bmQQDHoY';
const supabase = createClient(url, key);

async function inspectProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').limit(5);
  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('Profiles structure:', data);
    if (data && data.length > 0) {
      console.log('Available keys:', Object.keys(data[0]));
    }
  }
}

inspectProfiles();
