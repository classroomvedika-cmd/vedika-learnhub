import { createClient } from '@supabase/supabase-js';

const url = 'https://zaweivmgzxjfthvkkmzl.supabase.co';
const key = 'sb_publishable_jmJ1F5fwyPLFV34h-LE03Q_bmQQDHoY';

const supabase = createClient(url, key);

async function testAllPossibleCols() {
  const testTable = async (tableName: string, cols: string[]) => {
    const valid: string[] = [];
    for (const c of cols) {
      const { error } = await supabase.from(tableName).select(c).limit(1);
      if (!error) valid.push(c);
    }
    console.log(`=== ${tableName} VALID COLUMNS ===\n`, valid.join(', '));
  };

  await testTable('doubts', [
    'id', 'student_uid', 'user_id', 'sender_uid', 'title', 'subject', 'question', 'description',
    'doubt', 'details', 'text', 'message', 'query', 'status', 'state', 'resolved',
    'audio_url', 'image_url', 'photo_url', 'file_url', 'created_at', 'updated_at'
  ]);

  await testTable('doubt_replies', [
    'id', 'doubt_id', 'sender_uid', 'user_id', 'reply', 'answer', 'message', 'text',
    'comment', 'is_admin', 'role', 'created_at', 'updated_at'
  ]);

  await testTable('notifications', [
    'id', 'student_uid', 'user_id', 'title', 'message', 'body', 'content', 'type',
    'is_read', 'read', 'created_at', 'updated_at'
  ]);
}

testAllPossibleCols();
