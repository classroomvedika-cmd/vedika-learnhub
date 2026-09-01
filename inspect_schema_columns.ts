import { createClient } from '@supabase/supabase-js';

const url = 'https://zaweivmgzxjfthvkkmzl.supabase.co';
const key = 'sb_publishable_jmJ1F5fwyPLFV34h-LE03Q_bmQQDHoY';
const supabase = createClient(url, key);

async function inspectSchema() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(0); // This gets the schema headers if returned
  
  console.log('Profiles columns query status:', { error });
}

inspectSchema();
