import { createClient } from '@supabase/supabase-js';

const url = 'https://zaweivmgzxjfthvkkmzl.supabase.co';
const key = 'sb_publishable_jmJ1F5fwyPLFV34h-LE03Q_bmQQDHoY';

const supabase = createClient(url, key);

async function inspectSchemaViaInsert() {
  const tables = ['profiles', 'plans', 'group_messages', 'private_messages', 'doubts', 'doubt_replies', 'notifications'];
  for (const table of tables) {
    const res = await supabase.from(table).insert({ __invalid_column_name_test__: '1' });
    console.log(`Table '${table}' insert error:`, res.error?.message);
  }
}

inspectSchemaViaInsert();
