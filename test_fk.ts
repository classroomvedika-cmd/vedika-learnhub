import { createClient } from '@supabase/supabase-js';

const url = 'https://zaweivmgzxjfthvkkmzl.supabase.co';
const key = 'sb_publishable_jmJ1F5fwyPLFV34h-LE03Q_bmQQDHoY';

const supabase = createClient(url, key);

async function testFk() {
  console.log('--- All profiles in DB ---');
  const allProfiles = await supabase.from('profiles').select('*');
  console.log('Count:', allProfiles.data?.length);
  console.log('Profiles data:', allProfiles.data);

  // Check if there are any admin profiles
  const adminProfiles = await supabase.from('profiles').select('*').eq('role', 'admin');
  console.log('Admin profiles:', adminProfiles.data);

  // Also check doubts, doubt_replies, notifications schema
  console.log('\n--- Doubts columns ---');
  const doubtsCols = ['id', 'student_id', 'student_uid', 'user_id', 'title', 'question', 'subject', 'status', 'created_at'];
  for (const c of doubtsCols) {
    const res = await supabase.from('doubts').select(c).limit(1);
    console.log(`doubts.${c}: ${res.error ? 'INVALID (' + res.error.message + ')' : 'VALID'}`);
  }

  console.log('\n--- Doubt Replies columns ---');
  const doubtRepliesCols = ['id', 'doubt_id', 'sender_id', 'sender_uid', 'user_id', 'reply', 'message', 'is_admin', 'created_at'];
  for (const c of doubtRepliesCols) {
    const res = await supabase.from('doubt_replies').select(c).limit(1);
    console.log(`doubt_replies.${c}: ${res.error ? 'INVALID (' + res.error.message + ')' : 'VALID'}`);
  }

  console.log('\n--- Notifications columns ---');
  const notifCols = ['id', 'user_id', 'student_id', 'student_uid', 'title', 'message', 'is_read', 'read', 'created_at'];
  for (const c of notifCols) {
    const res = await supabase.from('notifications').select(c).limit(1);
    console.log(`notifications.${c}: ${res.error ? 'INVALID (' + res.error.message + ')' : 'VALID'}`);
  }
}

testFk();
