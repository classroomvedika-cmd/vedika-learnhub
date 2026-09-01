import { createClient } from '@supabase/supabase-js';

const url = 'https://zaweivmgzxjfthvkkmzl.supabase.co';
const key = 'sb_publishable_jmJ1F5fwyPLFV34h-LE03Q_bmQQDHoY';

const supabase = createClient(url, key);

async function inspectAllTables() {
  console.log('=== Doubts Columns Check ===');
  const doubtTest = await supabase.from('doubts').select('*').limit(1);
  console.log('Doubts sample:', doubtTest.data, 'Error:', doubtTest.error);

  console.log('=== Doubt Replies Columns Check ===');
  const replyTest = await supabase.from('doubt_replies').select('*').limit(1);
  console.log('Doubt replies sample:', replyTest.data, 'Error:', replyTest.error);

  console.log('=== Notifications Columns Check ===');
  const notifTest = await supabase.from('notifications').select('*').limit(1);
  console.log('Notifications sample:', notifTest.data, 'Error:', notifTest.error);

  console.log('=== Private Messages Columns Check ===');
  const pmTest = await supabase.from('private_messages').select('*').limit(1);
  console.log('Private messages sample:', pmTest.data, 'Error:', pmTest.error);

  console.log('=== Group Messages Columns Check ===');
  const gmTest = await supabase.from('group_messages').select('*').limit(1);
  console.log('Group messages sample:', gmTest.data, 'Error:', gmTest.error);

  console.log('=== Plans Columns Check ===');
  const plansTest = await supabase.from('plans').select('*').limit(1);
  console.log('Plans sample:', plansTest.data, 'Error:', plansTest.error);
}

inspectAllTables();
